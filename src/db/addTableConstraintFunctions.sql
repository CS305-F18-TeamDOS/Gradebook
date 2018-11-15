--addTableConstraintFunctions.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/14/2018

--this script creates the functions used by Team DOS's
--Gradebook tables that require functions in their CHECK constraint

--check that DueDate of AssessmentItem is not
--before the StartDate or EndDate of the related Section
--used in check constraint for AssessmentItem table
--takes a DueDate and ComponentID from AssessmentItem as parameters
CREATE OR REPLACE FUNCTION DueDateValidityCheck
(DueDate DATE, ComponentID INT) RETURNS BOOLEAN AS
$$
BEGIN

  IF (
      (SELECT StartDate --first check the start date of the associated section
      FROM Section
      INNER JOIN AssessmentComponent
      ON AssessmentComponent.ID = ComponentID
      AND AssessmentComponent.Section = Section.ID) <= DueDate)
    AND
      (DueDate <= (SELECT EndDate --next check the end date of the associated section
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
