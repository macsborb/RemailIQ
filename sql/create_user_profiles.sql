-- Création de la table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INTEGER,
  profession VARCHAR(200),
  company VARCHAR(200),
  position VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création d'un index sur user_id pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE user_profiles IS 'Profils des utilisateurs avec leurs informations personnelles et professionnelles';
COMMENT ON COLUMN user_profiles.user_id IS 'ID de l''utilisateur référencé dans la table users';
COMMENT ON COLUMN user_profiles.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN user_profiles.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN user_profiles.age IS 'Âge de l''utilisateur';
COMMENT ON COLUMN user_profiles.profession IS 'Profession ou métier de l''utilisateur';
COMMENT ON COLUMN user_profiles.company IS 'Entreprise où travaille l''utilisateur';
COMMENT ON COLUMN user_profiles.position IS 'Poste ou titre professionnel de l''utilisateur'; 