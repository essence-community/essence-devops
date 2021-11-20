--liquibase formatted sql
--changeset artemov_i:init_schema_essence_api_builder dbms:postgresql splitStatements:false stripComments:false
CREATE SCHEMA IF NOT EXISTS ${user.table} AUTHORIZATION ${user.update};
--changeset artemov_i:init_schema_essence_api_builder_2 dbms:postgresql splitStatements:false stripComments:false
create extension IF NOT EXISTS "uuid-ossp";
