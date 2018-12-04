--initializeDB.sql - Gradebook

--Andrew Figueroa, Steven Rollo, Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script sets up access controls for Gradebook roles
-- it also creates a 'Gradebook' schema to store app-specific data and code

--This script should be run once in a database where Gradebook data is to be
--stored
-- multiple Gradebook DBs are possible on the same server even in deployment,
-- because as of now multi-tenancy is possible only through multiple DBs;
-- multiple DBs may also be needed during development and testing

--This script should be the first to run after creating the database
-- it should be run while the database is still empty

--This script should be run by a superuser


START TRANSACTION;


--Suppress messages below WARNING level for the duration of this script
SET LOCAL client_min_messages TO WARNING;


--Make sure current user is superuser
DO
$$
BEGIN
   IF NOT EXISTS (SELECT * FROM pg_catalog.pg_roles
                  WHERE rolname = current_user AND rolsuper = TRUE
                 ) THEN
      RAISE EXCEPTION 'Insufficient privileges: '
                      'script must be run by a superuser';
   END IF;
END
$$;


--Make sure the expected app-specific roles are already defined:
-- roles expected: Gradebook, GB_WebApp
DO
$$
DECLARE
   gradebookRoleCount NUMERIC(1);
BEGIN
   SELECT COUNT(*)
   FROM pg_catalog.pg_roles
   WHERE rolname IN ('gradebook', 'gb_webapp', 'student', 'instructor')
   INTO gradebookRoleCount;

   IF gradebookRoleCount <> 4 THEN
      RAISE EXCEPTION
         'Missing roles: one or more of the expected Gradebook roles '
         'are not defined';
   END IF;
END
$$;


--Grant/revoke appropriate privileges to/from various roles on current database
DO
$$
DECLARE
   currentDB VARCHAR(128);
   currentSchema VARCHAR(128);
BEGIN
   currentDB = current_database();
   currentSchema = current_schema();

   --deny "public", student, and instructor permission to do anything with the database
   -- Postgres grants a few privileges by default to all users
   EXECUTE format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM PUBLIC', currentDB);
   EXECUTE format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM Student', currentDB);
   EXECUTE format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM Instructor', currentDB);

   --grant student and instructor permission to access the current schema
   EXECUTE format('GRANT ALL PRIVILEGES ON SCHEMA %I TO Student', currentSchema);
   EXECUTE format('GRANT ALL PRIVILEGES ON SCHEMA %I TO Instructor', currentSchema);

   --give Gradebook role all privileges on the current database
   EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO Gradebook', currentDB);

   --let user GB_WebApp, Student, and Instructor roles connect to the DB
   EXECUTE format('GRANT CONNECT ON DATABASE %I TO GB_WebApp', currentDB);
   EXECUTE format('GRANT CONNECT ON DATABASE %I TO Student', currentDB);
   EXECUTE format('GRANT CONNECT ON DATABASE %I TO Instructor', currentDB);

END
$$;


--Remove all privileges from public on objects created in the future in this DB
-- this alteration applies to all schemas in this DB
ALTER DEFAULT PRIVILEGES REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL PRIVILEGES ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL PRIVILEGES ON TYPES FROM PUBLIC;


ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO Student;
ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO Instructor;

--Give Gradebook role all privileges on objects created in the future in this DB
-- this alteration applies to all schemas in this DB
ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TABLES TO Gradebook;
ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON SEQUENCES TO Gradebook;
ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON FUNCTIONS TO Gradebook;
ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TYPES TO Gradebook;

--Create a schema to hold app-specific info and permit only the Gradebook role
--to create or use objects in that schema
-- this code might have to be moved to a function if schemas are used to support
-- multi-tenancy (schema name will be a parameter)

COMMIT;
