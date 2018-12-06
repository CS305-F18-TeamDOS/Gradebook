--addSeasonMgmt.sql - Gradebook

--Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--Edited By Team DOS - Fall 2018 CS305-71
-- Kyle Bella, Kenneth Kozlowski, Joe Tether

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script creates functions related to seasons
-- the script should be run as part of application installation

--Spool results to a file in the current directory
\o spoolSeasonMgmt.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '


--Suppress messages below WARNING level for the duration of this script
SET LOCAL client_min_messages TO WARNING;


--Function to get the details of the season matching a "season identification"
-- a season identification is season order, season code, or season name
-- performs case-insensitive match of season name and code
-- this function makes it easier for users to indicate a season by any of the
-- three possible identifiers for seasons
DROP FUNCTION IF EXISTS getSeason(VARCHAR(20));

CREATE FUNCTION getSeason(seasonIdentification VARCHAR(20))
RETURNS TABLE
(
   Season_Order NUMERIC(1,0),
   Name VARCHAR(20),
   Code CHAR(1)
)
AS
$$

   SELECT Season_Order, Name, Code
   FROM Season
   WHERE CASE
            WHEN $1 ~ '^[0-9]$' THEN Season_Order = to_number($1,'9')
            WHEN LENGTH($1) = 1 THEN Code = UPPER($1)
            ELSE LOWER(TRIM(Name)) = LOWER(TRIM($1))
         END;

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT
   ROWS 1;


--Function to get the details of the season matching a season order
-- this function exists to support clients that pass season order as a number
DROP FUNCTION IF EXISTS getSeason(NUMERIC(1,0));

CREATE FUNCTION getSeason(seasonOrder NUMERIC(1,0))
RETURNS TABLE
(
   Season_Order NUMERIC(1,0),
   Name VARCHAR(20),
   Code CHAR(1)
)
AS
$$

   SELECT Season_Order, Name, Code
   FROM Season
   WHERE Season_Order = $1;

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT
   ROWS 1;



--Function to get the "order" of the season matching a "season identification"
DROP FUNCTION IF EXISTS getSeasonOrder(VARCHAR(20));

CREATE FUNCTION getSeasonOrder(seasonIdentification VARCHAR(20))
RETURNS NUMERIC(1,0)
AS
$$

   SELECT Season_Order
   FROM getSeason($1);

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT;

\o
