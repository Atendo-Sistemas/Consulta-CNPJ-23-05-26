/**
 * Auth Service
 * Lógica de autenticação, registro e gerenciamento de usuários
 */

import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { User, CreateUserRequest, LoginRequest, AuthResponse, AppError, ErrorCodes } from '../types/index.js';

export class AuthService {
  async register(tenantId: string, data: CreateUserRequest): Promise<AuthResponse> {
    // Validar email
    if (!this.isValidEmail(data.email)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Email inválido'
      );
    }

    // Validar senha
    if (!data.password || data.password.length < 8) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Senha deve ter no mínimo 8 caracteres'
      );
    }

    // Verificar se usuário já existe
    const existingUser = await query(
      'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, data.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Usuário com este email já existe'
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const result = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [
        tenantId,
        data.email.toLowerCase(),
        passwordHash,
        data.firstName || null,
        data.lastName || null,
        data.role || 'user',
        true,
      ]
    );

    const user = this.mapToUser(tenantId, result.rows[0]);
    const token = generateToken(user.id, tenantId, user.email, user.role);

    return {
      token,
      user,
      expiresIn: 7 * 24 * 60 * 60, // 7 dias em segundos
    };
  }

  async login(tenantId: string, data: LoginRequest): Promise<AuthResponse> {
    if (!data.email || !data.password) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        401,
        'Email e senha são obrigatórios'
      );
    }

    // Buscar usuário
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       WHERE tenant_id = $1 AND email = $2 AND is_active = true`,
      [tenantId, data.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        401,
        'Email ou senha incorretos'
      );
    }

    const userRow = result.rows[0];

    // Verificar senha
    const passwordMatch = await bcrypt.compare(data.password, userRow.password_hash);

    if (!passwordMatch) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        401,
        'Email ou senha incorretos'
      );
    }

    // Atualizar last_login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userRow.id]
    );

    const user = this.mapToUser(tenantId, userRow);
    const token = generateToken(user.id, tenantId, user.email, user.role);

    return {
      token,
      user,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  async getUserById(userId: string, tenantId: string): Promise<User> {
    const result = await query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        404,
        'Usuário não encontrado'
      );
    }

    return this.mapToUser(tenantId, result.rows[0]);
  }

  async updateUser(userId: string, tenantId: string, data: Partial<CreateUserRequest>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(data.lastName);
    }

    if (data.password !== undefined) {
      if (data.password.length < 8) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          400,
          'Senha deve ter no mínimo 8 caracteres'
        );
      }
      const passwordHash = await bcrypt.hash(data.password, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return this.getUserById(userId, tenantId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    values.push(tenantId);

    const result = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING id, tenant_id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        404,
        'Usuário não encontrado'
      );
    }

    return this.mapToUser(tenantId, result.rows[0]);
  }

  async listTenantUsers(tenantId: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    const result = await query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return {
      data: result.rows.map((row) => this.mapToUser(tenantId, row)),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }

  private mapToUser(tenantId: string, row: any): User {
    return {
      id: row.id,
      tenantId,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new AuthService();
