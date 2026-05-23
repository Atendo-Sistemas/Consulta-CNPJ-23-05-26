/**
 * License Service
 * Gerenciamento e validação de licenças por IP
 */

import crypto from 'crypto';
import { query } from '../config/database.js';
import { License, LicenseValidationRequest, LicenseValidationResponse, Tenant, AppError, ErrorCodes } from '../types/index.js';

export class LicenseService {
  /**
   * Gera uma chave de licença criptografada
   */
  generateLicenseKey(tenantId: string, ipAddress: string): string {
    const data = `${tenantId}:${ipAddress}:${Date.now()}`;
    const hash = crypto
      .createHmac('sha256', process.env.LICENSE_SECRET_KEY || 'your_license_secret_key')
      .update(data)
      .digest('hex');
    
    return `LIC-${hash.substring(0, 32).toUpperCase()}`;
  }

  /**
   * Valida uma licença por chave e IP
   */
  async validateLicense(request: LicenseValidationRequest): Promise<LicenseValidationResponse> {
    try {
      const result = await query(
        `SELECT l.*, t.id as tenant_id, t.name, t.slug, t.email, t.logo_url, 
                t.primary_color, t.secondary_color, t.custom_domain, t.is_active, t.is_white_label
         FROM licenses l
         JOIN tenants t ON l.tenant_id = t.id
         WHERE l.license_key = $1 AND l.ip_address = $2 AND l.is_active = true`,
        [request.licenseKey, request.ipAddress]
      );

      if (result.rows.length === 0) {
        return {
          isValid: false,
          message: 'Licença inválida ou não encontrada para este IP',
        };
      }

      const licenseRow = result.rows[0];

      // Verificar se licença expirou
      const now = new Date();
      if (new Date(licenseRow.valid_until) < now) {
        return {
          isValid: false,
          message: 'Licença expirada',
        };
      }

      // Atualizar última validação
      await query(
        'UPDATE licenses SET last_validation = CURRENT_TIMESTAMP WHERE id = $1',
        [licenseRow.id]
      );

      const license = this.mapToLicense(licenseRow);
      const tenant = this.mapToTenant(licenseRow);

      const expiresIn = Math.floor(
        (new Date(licenseRow.valid_until).getTime() - now.getTime()) / 1000
      );

      return {
        isValid: true,
        tenant,
        license,
        message: 'Licença válida',
        expiresIn,
      };
    } catch (error) {
      console.error('License validation error:', error);
      return {
        isValid: false,
        message: 'Erro ao validar licença',
      };
    }
  }

  /**
   * Cria uma nova licença
   */
  async createLicense(
    tenantId: string,
    ipAddress: string,
    plan: string,
    validDays: number = 30,
    hostname?: string
  ): Promise<License> {
    const licenseKey = this.generateLicenseKey(tenantId, ipAddress);
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + validDays * 24 * 60 * 60 * 1000);

    // Buscar limite de queries do plano
    const planResult = await query(
      'SELECT queries_limit FROM plans WHERE slug = $1',
      [plan]
    );

    const queriesLimit = planResult.rows.length > 0 ? planResult.rows[0].queries_limit : 1000;

    const result = await query(
      `INSERT INTO licenses (tenant_id, license_key, ip_address, hostname, plan, queries_limit, valid_from, valid_until, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenantId, licenseKey, ipAddress, hostname, plan, queriesLimit, validFrom, validUntil, true]
    );

    return this.mapToLicense(result.rows[0]);
  }

  /**
   * Renova uma licença existente
   */
  async renewLicense(licenseId: string, validDays: number = 30): Promise<License> {
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const result = await query(
      `UPDATE licenses
       SET valid_until = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [validUntil, licenseId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        404,
        'Licença não encontrada'
      );
    }

    return this.mapToLicense(result.rows[0]);
  }

  /**
   * Lista licenças de um tenant
   */
  async listTenantLicenses(tenantId: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM licenses WHERE tenant_id = $1',
      [tenantId]
    );

    const result = await query(
      `SELECT * FROM licenses
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return {
      data: result.rows.map((row) => this.mapToLicense(row)),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }

  /**
   * Verifica limite de queries
   */
  async checkQueryLimit(tenantId: string): Promise<boolean> {
    const result = await query(
      `SELECT l.queries_limit, l.queries_used
       FROM licenses l
       WHERE l.tenant_id = $1 AND l.is_active = true AND l.valid_until > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const license = result.rows[0];
    return license.queries_used < license.queries_limit;
  }

  /**
   * Incrementa contador de queries
   */
  async incrementQueryCount(tenantId: string): Promise<void> {
    await query(
      `UPDATE licenses
       SET queries_used = queries_used + 1
       WHERE tenant_id = $1 AND is_active = true AND valid_until > CURRENT_TIMESTAMP`,
      [tenantId]
    );
  }

  /**
   * Obtém estatísticas de uso
   */
  async getLicenseStats(licenseId: string): Promise<any> {
    const result = await query(
      `SELECT 
        l.queries_limit,
        l.queries_used,
        l.valid_until,
        COUNT(DISTINCT qh.user_id) as active_users,
        COUNT(qh.id) as total_queries_this_month
       FROM licenses l
       LEFT JOIN query_history qh ON l.tenant_id = qh.tenant_id 
         AND qh.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
       WHERE l.id = $1
       GROUP BY l.id, l.queries_limit, l.queries_used, l.valid_until`,
      [licenseId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        404,
        'Licença não encontrada'
      );
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
      activeUsers: parseInt(row.active_users),
      totalQueriesThisMonth: parseInt(row.total_queries_this_month),
      expiresIn,
      expiresAt: row.valid_until,
    };
  }

  private mapToLicense(row: any): License {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      licenseKey: row.license_key,
      ipAddress: row.ip_address,
      hostname: row.hostname,
      plan: row.plan,
      queriesLimit: row.queries_limit,
      queriesUsed: row.queries_used,
      additionalUsers: row.additional_users,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      lastValidation: row.last_validation,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToTenant(row: any): Tenant {
    return {
      id: row.tenant_id,
      name: row.name,
      slug: row.slug,
      email: row.email,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      customDomain: row.custom_domain,
      isActive: row.is_active,
      isWhiteLabel: row.is_white_label,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new LicenseService();
