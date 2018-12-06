--dropTables.sql - GradeBook

--Zaid Bhujwala, Zach Boylan, Steven Rollo, Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--Edited By Team DOS - Fall 2018 CS305-71
-- Kyle Bella, Kenneth Kowlozski, Joe Tether

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script drops all tables created by createTables.sql, if they exist, with CASCADE

--Spool results to a file in the current directory
\o spoolDropTables.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '

DROP TABLE IF EXISTS Course CASCADE;

DROP TABLE IF EXISTS Season CASCADE;

DROP TABLE IF EXISTS Term CASCADE;

DROP TABLE IF EXISTS Instructor CASCADE;

DROP TABLE IF EXISTS Section CASCADE;

DROP TABLE IF EXISTS Grade CASCADE;

DROP TABLE IF EXISTS GradeTier CASCADE;

DROP TABLE IF EXISTS Student CASCADE;

DROP TABLE IF EXISTS Enrollee CASCADE;

DROP TABLE IF EXISTS AttendanceStatus CASCADE;

DROP TABLE IF EXISTS AttendanceRecord CASCADE;

DROP TABLE IF EXISTS AssessmentComponent CASCADE;

DROP TABLE IF EXISTS AssessmentItem CASCADE;

DROP TABLE IF EXISTS Submission CASCADE;

\o
