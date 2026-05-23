-- ============================================
-- CNPJ SaaS - Dados Iniciais
-- ============================================

-- Inserir planos padrão
INSERT INTO plans (name, slug, description, price_monthly, queries_limit, max_users, features, is_active) VALUES
('Free', 'free', 'Plano gratuito para testar', 0.00, 50, 1, '["Consultas básicas", "Histórico de 30 dias", "Suporte por email"]', true),
('Pro', 'pro', 'Plano profissional para pequenas empresas', 99.00, 1000, 5, '["Consultas ilimitadas", "Histórico completo", "API access", "Suporte prioritário", "Relatórios avançados"]', true),
('Enterprise', 'enterprise', 'Plano para empresas grandes', 499.00, 10000, 50, '["Consultas ilimitadas", "Histórico completo", "API access", "Suporte 24/7", "Relatórios avançados", "White Label", "Webhooks", "SSO"]', true),
('White Label', 'white-label', 'Licença para resellers', 50.00, NULL, NULL, '["Instância dedicada", "Customização completa", "Suporte técnico", "Validação de licença online"]', true);

-- Inserir tenant de demo
INSERT INTO tenants (name, slug, email, primary_color, secondary_color, is_active, is_white_label) VALUES
('CNPJ SaaS Demo', 'demo', 'demo@cnpj-saas.local', '#4F46E5', '#10B981', true, false);

-- Inserir usuário admin de demo
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active) 
SELECT id, 'admin@demo.local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'Admin', 'Demo', 'admin', true
FROM tenants WHERE slug = 'demo';

-- Inserir licença de demo (válida por 30 dias)
INSERT INTO licenses (tenant_id, license_key, ip_address, hostname, plan, queries_limit, valid_from, valid_until, is_active)
SELECT id, 'DEMO-' || substring(id::text, 1, 8) || '-' || substring(id::text, 10, 8), '127.0.0.1'::inet, 'localhost', 'pro', 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true
FROM tenants WHERE slug = 'demo';
