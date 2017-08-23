--importAttendance.sql - Gradebook

--Andrew Figueroa
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.


--Due to the use of the \COPY meta-command, this script needs to be run using the
-- psql command line tool provided with most PostgreSQL installations. The current 
-- working directory needs be the same as this script's location.

--This script should only be run after importing all sample Roster data provided
-- in \tests\data\Roster, as there is a correspondance between the sample Roster
-- and sample Attendance data.
--Since the names in the sample data must match those in the Student table,
-- this script should be run before any humanization of student names occurs.

--The following files, which contain the sample Attendance data, must be in the
-- same directory as this script:
--  2017SpringCS110-05Attendance.csv
--  2017SpringCS110-72Attendance.csv
--  2017SpringCS110-74Attendance.csv


--Create temporary staging table
DROP TABLE IF EXISTS pg_temp.AttendanceStaging;
CREATE TABLE pg_temp.AttendanceStaging
(
   LName VARCHAR(50),
   FName VARCHAR(50),
   MName VARCHAR(50),
   Date DATE,
   Code CHAR(1)
);


--Define a temporary function for moving data from staging table to AttendanceRecord
CREATE OR REPLACE FUNCTION pg_temp.importAttendance(sectionID INT)
   RETURNS VOID AS
$$
   --Add AttendanceStaging.Code values that do not exist in AttendanceStatus.
   -- Code is also used as both the Status and Description attributes if an INSERT
   -- is performed. Does not ignore conflicts on AttendanceStatus.Description. NULL
   -- Code values are interpreted as 'P'.
   INSERT INTO Gradebook.AttendanceStatus
   SELECT DISTINCT COALESCE(UPPER(Code), 'P'), COALESCE(UPPER(Code), 'P')
   FROM pg_temp.AttendanceStaging
   ON CONFLICT (Status) DO NOTHING;
   
   --Match student from each entry in sample data with their corresponsing entry in 
   -- the Student table by joining on a match of the 3 name parts. MName can be NULL
   -- and rows with NULL as the attendance code are interpreted as Present and not
   -- imported. (See behavior of Gradebook.getAttendance() in src/db/getAttendance.sql)
   INSERT INTO Gradebook.AttendanceRecord
   SELECT s.ID, $1, a.Date, UPPER(a.Code)
   FROM pg_temp.AttendanceStaging a JOIN Gradebook.Student s ON
        a.FName = s.FName AND a.LName = s.LName AND
        COALESCE(a.MName, '') = COALESCE(s.MName, '')
   WHERE a.Code IS NOT NULL
   ON CONFLICT DO NOTHING;
$$ LANGUAGE sql;


--Import data from files to staging table and call import function for each section
\COPY pg_temp.AttendanceStaging FROM '2017SpringCS110-05Attendance.csv' WITH csv HEADER
SELECT pg_temp.importAttendance(Gradebook.getSectionID(2017, '0', 'CS110', '05'));
TRUNCATE pg_temp.AttendanceStaging;

\COPY pg_temp.AttendanceStaging FROM '2017SpringCS110-72Attendance.csv' WITH csv HEADER
SELECT pg_temp.importAttendance(Gradebook.getSectionID(2017, '0', 'CS110', '72'));
TRUNCATE pg_temp.AttendanceStaging;

\COPY pg_temp.AttendanceStaging FROM '2017SpringCS110-74Attendance.csv' WITH csv HEADER
SELECT pg_temp.importAttendance(Gradebook.getSectionID(2017, '0', 'CS110', '74'));
TRUNCATE pg_temp.AttendanceStaging;
