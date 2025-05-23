ALTER TABLE "issues" ALTER COLUMN "number_text" DROP EXPRESSION;--> statement-breakpoint
ALTER TABLE "pull_requests" ALTER COLUMN "number_text" DROP EXPRESSION;--> statement-breakpoint

CREATE OR REPLACE FUNCTION update_number_text_from_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.number_text = CAST(NEW.number AS TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER trigger_update_issues_number_text
BEFORE INSERT OR UPDATE OF "number" ON "issues"
FOR EACH ROW
EXECUTE FUNCTION update_number_text_from_number();--> statement-breakpoint

CREATE TRIGGER trigger_update_pull_requests_number_text
BEFORE INSERT OR UPDATE OF "number" ON "pull_requests"
FOR EACH ROW
EXECUTE FUNCTION update_number_text_from_number();
