-- Table pour stocker l'historique des emails générés par l'IA
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email_content TEXT NOT NULL,
  email_subject TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tone VARCHAR(255),
  size VARCHAR(50),
  response_type VARCHAR(50),
  selected_for_context BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour accélérer la recherche par utilisateur
CREATE INDEX idx_email_history_user_id ON email_history(user_id);

-- Politique RLS pour sécuriser l'accès aux données
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne puissent voir que leurs propres emails
CREATE POLICY user_emails_policy ON email_history 
  FOR ALL
  USING (auth.uid() = user_id); 