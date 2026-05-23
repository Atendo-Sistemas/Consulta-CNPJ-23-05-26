/**
 * Serviço de CNPJ
 * Consulta à API de CNPJ e gerenciamento de histórico
 */

import axios from 'axios';
import { query } from '../config/database.js';
import { CNPJData, QueryHistory, AppError, ErrorCodes } from '../types/index.js';
import licenseService from './licenseService.js';

export class CNPJService {
  private apiUrl = process.env.CNPJ_API_URL || 'https://api.cnpj.ws/cnpj';

  /**
   * Consulta CNPJ na API pública
   */
  async queryCNPJ(cnpj: string): Promise<CNPJData> {
    // Validar formato do CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      throw new AppError(
        ErrorCodes.INVALID_CNPJ,
        400,
        'CNPJ deve conter 14 dígitos'
      );
    }

    try {
      const response = await axios.get(`${this.apiUrl}/${cleanCnpj}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new AppError(
          ErrorCodes.CNPJ_NOT_FOUND,
          404,
          'CNPJ não encontrado'
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          503,
          'Serviço de CNPJ temporariamente indisponível'
        );
      }

      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        'Erro ao consultar CNPJ'
      );
    }
  }

  /**
   * Realiza consulta com validação de licença e histórico
   */
  async performQuery(
    tenantId: string,
    userId: string,
    cnpj: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<{ data: CNPJData; history: QueryHistory }> {
    // Verificar limite de queries
    const hasLimit = await licenseService.checkQueryLimit(tenantId);

    if (!hasLimit) {
      throw new AppError(
        ErrorCodes.QUERY_LIMIT_EXCEEDED,
        429,
        'Limite de consultas atingido para este mês'
      );
    }

    let cnpjData: CNPJData;
    let status: 'success' | 'not_found' | 'error' = 'success';
    let errorMessage: string | undefined;

    try {
      cnpjData = await this.queryCNPJ(cnpj);
    } catch (error) {
      if (error instanceof AppError) {
        status = error.code === ErrorCodes.CNPJ_NOT_FOUND ? 'not_found' : 'error';
        errorMessage = error.message;
      } else {
        status = 'error';
        errorMessage = 'Erro desconhecido';
      }

      cnpjData = {};
    }

    // Incrementar contador
    await licenseService.incrementQueryCount(tenantId);

    // Salvar no histórico
    const history = await this.saveQueryHistory(
      tenantId,
      userId,
      cnpj,
      status,
      cnpjData,
      errorMessage,
      ipAddress,
      userAgent
    );

    if (status !== 'success') {
      throw new AppError(
        status === 'not_found' ? ErrorCodes.CNPJ_NOT_FOUND : ErrorCodes.INTERNAL_ERROR,
        status === 'not_found' ? 404 : 500,
        errorMessage || 'Erro ao consultar CNPJ'
      );
    }

    return { data: cnpjData, history };
  }

  /**
   * Salva consulta no histórico
   */
  async saveQueryHistory(
    tenantId: string,
    userId: string,
    cnpj: string,
    status: 'success' | 'not_found' | 'error',
    responseData: CNPJData,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<QueryHistory> {
    const companyName = responseData.razao_social || 
                       responseData.estabelecimento?.nome_fantasia ||
                       undefined;

    const result = await query(
      `INSERT INTO query_history (tenant_id, user_id, cnpj, company_name, status, error_message, response_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tenantId,
        userId,
        cnpj.replace(/\D/g, ''),
        companyName,
        status,
        errorMessage || null,
        status === 'success' ? JSON.stringify(responseData) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );

    return this.mapToQueryHistory(result.rows[0]);
  }

  /**
   * Obtém histórico de consultas
   */
  async getQueryHistory(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      userId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any> {
    let whereClause = 'WHERE qh.tenant_id = $1';
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (filters?.userId) {
      whereClause += ` AND qh.user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters?.status) {
      whereClause += ` AND qh.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.startDate) {
      whereClause += ` AND qh.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      whereClause += ` AND qh.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM query_history qh ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT qh.*, u.email as user_email
       FROM query_history qh
       LEFT JOIN users u ON qh.user_id = u.id
       ${whereClause}
       ORDER BY qh.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows.map((row) => this.mapToQueryHistory(row)),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }

  /**
   * Obtém estatísticas de consultas
   */
  async getQueryStats(tenantId: string, days: number = 30): Promise<any> {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN status = 'not_found' THEN 1 ELSE 0 END) as not_found_count
       FROM query_history
       WHERE tenant_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [tenantId]
    );

    return result.rows.map((row) => ({
      date: row.date,
      total: parseInt(row.total),
      success: parseInt(row.success_count),
      errors: parseInt(row.error_count),
      notFound: parseInt(row.not_found_count),
    }));
  }

  /**
   * Obtém dashboard stats
   */
  async getDashboardStats(tenantId: string): Promise<any> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_queries,
        SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP) THEN 1 ELSE 0 END) as queries_this_month,
        COUNT(DISTINCT user_id) as active_users,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate,
        MAX(created_at) as last_query_date
       FROM query_history
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    const licenseStats = await this.getLicenseStats(tenantId);

    return {
      totalQueries: parseInt(row.total_queries) || 0,
      queriesThisMonth: parseInt(row.queries_this_month) || 0,
      queriesRemaining: licenseStats.queriesRemaining,
      activeUsers: parseInt(row.active_users) || 0,
      successRate: parseFloat(row.success_rate) || 0,
      lastQueryDate: row.last_query_date,
      ...licenseStats,
    };
  }

  /**
   * Obtém estatísticas de licença
   */
  private async getLicenseStats(tenantId: string): Promise<any> {
    const result = await query(
      `SELECT queries_limit, queries_used, valid_until
       FROM licenses
       WHERE tenant_id = $1 AND is_active = true AND valid_until > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return {
        queriesLimit: 0,
        queriesUsed: 0,
        queriesRemaining: 0,
        expiresIn: 0,
      };
    }

    const row = result.rows[0];
    const queriesRemaining = Math.max(0, row.queries_limit - row.queries_used);
    const expiresIn = Math.floor(
      (new Date(row.valid_until).getTime() - Date.now()) / 1000
    );

    return {
      queriesLimit: row.queries_limit,
      queriesUsed: row.queries_used,
      queriesRemaining,
      expiresIn,
    };
  }

  private mapToQueryHistory(row: any): QueryHistory {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      cnpj: row.cnpj,
      companyName: row.company_name,
      status: row.status,
      errorMessage: row.error_message,
      responseData: row.response_data ? JSON.parse(row.response_data) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    };
  }
}

export default new CNPJService();
