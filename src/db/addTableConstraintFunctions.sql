--addTableConstraintFunctions.sql - GradeBook

--Created By Team DOS - Fall 2018 CS305-71
-- Kyle Bella, Kenneth Kozlowski, Joe Tether


--this script creates the functions used by Gradebook table constraints
--currently the only table with a constraint function is AssessmentItem

--This script should be run before createTables.sql, so that the
--constraint functions will be available for function creation

--Spool results to a file in the current directory
\o spoolAddTableConstraintFunctions.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '


--check that DueDate of AssessmentItem is not
--before the StartDate or EndDate of the related Section
--
--this function also checks the validity of an AssessmentItem.AssignedDate
--AssignedDate cannot be after the Section.EndDate
--AssigneDate CAN be before the Section.EndDate, e.g. summer pre-reading
--
--used in check constraint for AssessmentItem table
--takes a DueDate, AssigneDate and ComponentID from AssessmentItem as parameters
CREATE OR REPLACE FUNCTION dueDateValidityCheck (DueDate DATE, AssignedDate DATE,
                                                  ComponentID INT)
RETURNS BOOLEAN AS
$$
BEGIN

  IF (
      (SELECT StartDate --first check the start date of the associated section
      FROM Section
      INNER JOIN AssessmentComponent
      ON AssessmentComponent.ID = ComponentID
      AND AssessmentComponent.Section = Section.ID) <= $1)
    AND
      ( $1 <= (SELECT EndDate --next check the end date of the associated section
      FROM Section
      INNER JOIN AssessmentComponent
      ON AssessmentComponent.ID = ComponentID
      AND AssessmentComponent.Section = Section.ID))
    AND
      ($2 <= (SELECT EndDate --finally, check AssignedDate <= end date
      FROM Section
      INNER JOIN AssessmentComponent
      ON AssessmentComponent.ID = ComponentID
      AND AssessmentComponent.Section = Section.ID)
    ) THEN RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;

END;
$$ LANGUAGE plpgsql
    VOLATILE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

\o
