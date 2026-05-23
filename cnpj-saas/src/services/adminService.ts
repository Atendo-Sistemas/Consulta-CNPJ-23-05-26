/**
 * Serviço de Admin
 * Gerenciamento de resellers, licenças, relatórios e configurações
 */

import { query } from '../config/database.js';
import { AppError, ErrorCodes } from '../types/index.js';

export class AdminService {
  /**
   * Obter estatísticas globais
   */
  async getGlobalStats(): Promise<any> {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM tenants WHERE role = 'reseller') as total_resellers,
        (SELECT COUNT(*) FROM licenses WHERE is_active = true) as active_licenses,
        (SELECT COUNT(*) FROM licenses WHERE is_active = true AND valid_until < CURRENT_TIMESTAMP) as expired_licenses,
        (SELECT COUNT(*) FROM query_history) as total_queries,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT SUM(queries_used) FROM licenses) as queries_processed,
        (SELECT AVG(queries_used)::float FROM licenses WHERE queries_limit > 0) as avg_queries_per_license
       FROM licenses LIMIT 1`
    );

    const row = result.rows[0] || {};

    return {
      totalResellers: parseInt(row.total_resellers) || 0,
      activeLicenses: parseInt(row.active_licenses) || 0,
      expiredLicenses: parseInt(row.expired_licenses) || 0,
      totalQueries: parseInt(row.total_queries) || 0,
      totalUsers: parseInt(row.total_users) || 0,
      queriesProcessed: parseInt(row.queries_processed) || 0,
      avgQueriesPerLicense: parseFloat(row.avg_queries_per_license) || 0,
    };
  }

  /**
   * Listar todos os resellers
   */
  async listResellers(page: number = 1, limit: number = 20, filters?: any): Promise<any> {
    let whereClause = "WHERE t.role = 'reseller'";
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.search) {
      whereClause += ` AND (t.name ILIKE $${paramCount} OR t.email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters?.status) {
      whereClause += ` AND t.is_active = $${paramCount}`;
      params.push(filters.status === 'active');
      paramCount++;
    }

    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM tenants t ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT 
        t.id,
        t.name,
        t.email,
        t.is_active,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT l.id) as total_licenses,
        COUNT(DISTINCT CASE WHEN l.is_active = true AND l.valid_until > CURRENT_TIMESTAMP THEN l.id END) as active_licenses,
        COALESCE(SUM(l.queries_limit), 0)::integer as total_queries_limit,
        COALESCE(SUM(l.queries_used), 0)::integer as total_queries_used,
        COUNT(DISTINCT u.id) as total_users
       FROM tenants t
       LEFT JOIN licenses l ON t.id = l.tenant_id
       LEFT JOIN users u ON t.id = u.tenant_id
       ${whereClause}
       GROUP BY t.id, t.name, t.email, t.is_active, t.created_at, t.updated_at
       ORDER BY t.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: row.is_active,
        totalLicenses: parseInt(row.total_licenses),
        activeLicenses: parseInt(row.active_licenses),
        totalQueriesLimit: row.total_queries_limit,
        totalQueriesUsed: row.total_queries_used,
        totalUsers: parseInt(row.total_users),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }

  /**
   * Obter detalhes de um reseller
   */
  async getResellerDetails(tenantId: string): Promise<any> {
    const result = await query(
      `SELECT 
        t.id,
        t.name,
        t.email,
        t.is_active,
        t.branding,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT l.id) as total_licenses,
        COUNT(DISTINCT CASE WHEN l.is_active = true AND l.valid_until > CURRENT_TIMESTAMP THEN l.id END) as active_licenses,
        COALESCE(SUM(l.queries_limit), 0)::integer as total_queries_limit,
        COALESCE(SUM(l.queries_used), 0)::integer as total_queries_used,
        COUNT(DISTINCT u.id) as total_users
       FROM tenants t
       LEFT JOIN licenses l ON t.id = l.tenant_id
       LEFT JOIN users u ON t.id = u.tenant_id
       WHERE t.id = $1
       GROUP BY t.id, t.name, t.email, t.is_active, t.branding, t.created_at, t.updated_at`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Reseller não encontrado');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      branding: row.branding ? JSON.parse(row.branding) : null,
      totalLicenses: parseInt(row.total_licenses),
      activeLicenses: parseInt(row.active_licenses),
      totalQueriesLimit: row.total_queries_limit,
      totalQueriesUsed: row.total_queries_used,
      totalUsers: parseInt(row.total_users),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Atualizar reseller
   */
  async updateReseller(tenantId: string, data: any): Promise<any> {
    const result = await query(
      `UPDATE tenants 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           is_active = COALESCE($3, is_active),
           branding = COALESCE($4, branding),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        data.name || null,
        data.email || null,
        data.isActive !== undefined ? data.isActive : null,
        data.branding ? JSON.stringify(data.branding) : null,
        tenantId,
      ]
    );

    if (result.rows.length === 0) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Reseller não encontrado');
    }

    return result.rows[0];
  }

  /**
   * Listar todas as licenças
   */
  async listLicenses(page: number = 1, limit: number = 20, filters?: any): Promise<any> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.tenantId) {
      whereClause += ` AND l.tenant_id = $${paramCount}`;
      params.push(filters.tenantId);
      paramCount++;
    }

    if (filters?.status) {
      if (filters.status === 'active') {
        whereClause += ` AND l.is_active = true AND l.valid_until > CURRENT_TIMESTAMP`;
      } else if (filters.status === 'expired') {
        whereClause += ` AND (l.is_active = false OR l.valid_until <= CURRENT_TIMESTAMP)`;
      }
    }

    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM licenses l ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT 
        l.id,
        l.tenant_id,
        l.license_key,
        l.ip_address,
        l.queries_limit,
        l.queries_used,
        l.is_active,
        l.valid_from,
        l.valid_until,
        l.created_at,
        l.updated_at,
        t.name as tenant_name,
        t.email as tenant_email
       FROM licenses l
       LEFT JOIN tenants t ON l.tenant_id = t.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        tenantEmail: row.tenant_email,
        licenseKey: row.license_key,
        ipAddress: row.ip_address,
        queriesLimit: row.queries_limit,
        queriesUsed: row.queries_used,
        isActive: row.is_active,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }

  /**
   * Criar nova licença
   */
  async createLicense(data: any): Promise<any> {
    const licenseKey = this.generateLicenseKey();
    
    const result = await query(
      `INSERT INTO licenses (tenant_id, license_key, ip_address, queries_limit, valid_from, valid_until, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        data.tenantId,
        licenseKey,
        data.ipAddress,
        data.queriesLimit || 1000,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      ]
    );

    return {
      id: result.rows[0].id,
      licenseKey: result.rows[0].license_key,
      ipAddress: result.rows[0].ip_address,
      queriesLimit: result.rows[0].queries_limit,
      validFrom: result.rows[0].valid_from,
      validUntil: result.rows[0].valid_until,
    };
  }

  /**
   * Renovar licença
   */
  async renewLicense(licenseId: string, days: number = 30): Promise<any> {
    const result = await query(
      `UPDATE licenses 
       SET valid_until = CURRENT_TIMESTAMP + INTERVAL '${days} days',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [licenseId]
    );

    if (result.rows.length === 0) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Licença não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Revogar licença
   */
  async revokeLicense(licenseId: string): Promise<void> {
    const result = await query(
      `UPDATE licenses 
       SET is_active = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [licenseId]
    );

    if (result.rows.length === 0) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Licença não encontrada');
    }
  }

  /**
   * Obter relatório de uso por reseller
   */
  async getResellerUsageReport(startDate?: Date, endDate?: Date): Promise<any> {
    const result = await query(
      `SELECT 
        t.id,
        t.name,
        t.email,
        COUNT(DISTINCT qh.id) as total_queries,
        COUNT(DISTINCT CASE WHEN qh.status = 'success' THEN qh.id END) as success_queries,
        COUNT(DISTINCT CASE WHEN qh.status = 'error' THEN qh.id END) as error_queries,
        COUNT(DISTINCT CASE WHEN qh.status = 'not_found' THEN qh.id END) as not_found_queries,
        COUNT(DISTINCT u.id) as active_users,
        COUNT(DISTINCT l.id) as total_licenses
       FROM tenants t
       LEFT JOIN query_history qh ON t.id = qh.tenant_id
       LEFT JOIN users u ON t.id = u.tenant_id
       LEFT JOIN licenses l ON t.id = l.tenant_id
       WHERE t.role = 'reseller'
       ${startDate ? 'AND qh.created_at >= $1' : ''}
       ${endDate ? 'AND qh.created_at <= $2' : ''}
       GROUP BY t.id, t.name, t.email
       ORDER BY total_queries DESC`,
      [startDate, endDate].filter(Boolean)
    );

    return result.rows.map((row) => ({
      resellerId: row.id,
      resellerName: row.name,
      resellerEmail: row.email,
      totalQueries: parseInt(row.total_queries),
      successQueries: parseInt(row.success_queries),
      errorQueries: parseInt(row.error_queries),
      notFoundQueries: parseInt(row.not_found_queries),
      activeUsers: parseInt(row.active_users),
      totalLicenses: parseInt(row.total_licenses),
      successRate: row.total_queries > 0 
        ? (parseInt(row.success_queries) / parseInt(row.total_queries) * 100).toFixed(2)
        : 0,
    }));
  }

  /**
   * Obter relatório de receita
   */
  async getRevenueReport(startDate?: Date, endDate?: Date): Promise<any> {
    const result = await query(
      `SELECT 
        DATE_TRUNC('day', l.created_at) as date,
        COUNT(DISTINCT l.id) as new_licenses,
        COUNT(DISTINCT CASE WHEN l.valid_until > CURRENT_TIMESTAMP THEN l.id END) as active_licenses,
        COALESCE(SUM(l.queries_limit), 0)::integer as total_queries_limit
       FROM licenses l
       ${startDate ? 'WHERE l.created_at >= $1' : ''}
       ${endDate ? 'AND l.created_at <= $2' : ''}
       GROUP BY DATE_TRUNC('day', l.created_at)
       ORDER BY date DESC`,
      [startDate, endDate].filter(Boolean)
    );

    return result.rows.map((row) => ({
      date: row.date,
      newLicenses: parseInt(row.new_licenses),
      activeLicenses: parseInt(row.active_licenses),
      totalQueriesLimit: row.total_queries_limit,
      estimatedRevenue: (parseInt(row.new_licenses) * 50).toFixed(2), // R$ 50 por licença
    }));
  }

  /**
   * Gerar chave de licença
   */
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'LIC-';
    for (let i = 0; i < 20; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}

export default new AdminService();
