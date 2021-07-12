--liquibase formatted sql
--changeset artemov_i:init_role_essence_devops dbms:postgresql splitStatements:false stripComments:false
CREATE ROLE ${user.connect} WITH
  LOGIN
  NOSUPERUSER
  INHERIT
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;

ALTER ROLE ${user.connect} SET search_path TO public, pg_catalog;
ALTER USER ${user.connect} WITH PASSWORD '${user.connect}';

--changeset artemov_i:init_db_essence_devops dbms:postgresql runInTransaction:false splitStatements:false stripComments:false
CREATE DATABASE ${name.db}
    WITH 
    OWNER = ${user.connect}
    ENCODING = 'UTF8'
    LC_COLLATE = 'ru_RU.UTF-8'
    LC_CTYPE = 'ru_RU.UTF-8'
	  TEMPLATE = template0
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
