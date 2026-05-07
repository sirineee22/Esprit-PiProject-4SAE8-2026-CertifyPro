-- Script SQL pour créer la base de données du Forum Service
-- Usage: psql -U postgres -f create-database.sql

-- Créer la base de données (si elle n'existe pas)
CREATE DATABASE forumdb;

-- Se connecter à la base de données
\c forumdb

-- Les tables seront créées automatiquement par Hibernate/JPA
-- avec la configuration: spring.jpa.hibernate.ddl-auto=update

-- Vérifier que la base de données existe
SELECT datname FROM pg_database WHERE datname = 'forumdb';

