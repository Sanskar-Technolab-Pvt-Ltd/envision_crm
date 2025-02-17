from frappe.utils import nowdate
import frappe
from .cost_estimation import submit_cost_estimation


@frappe.whitelist()
def set_submission_date(doc, method):
    # submission_date only set when the quotation form is submitted
    if doc.docstatus == 1 and not doc.custom_submission_date:
        submission_date = nowdate()
        doc.custom_submission_date = submission_date
        # save the value in the database
        frappe.db.set_value(
            "Quotation", doc.name, "custom_submission_date", submission_date
        )


@frappe.whitelist()
def quotation_submission(doc, method):
     # call submit cost estimation 
    submit_cost_estimation(doc,method)
    
    # submission_date only set when the quotation form is submitted
    set_submission_date(doc,method)