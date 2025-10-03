import frappe
from erpnext.crm.doctype.lead.lead import Lead
from erpnext.crm.utils import (
    copy_comments,
    link_communications,
    link_open_events,
    link_open_tasks,
)
from frappe.utils import get_link_to_form
from frappe import _
from frappe.model.workflow import apply_workflow, get_transitions
from frappe.utils import nowdate



# ! Envision_crm.api.hook.controller.get_list_of_available_records
# ? METHOD TO GET LIST OF AVAILABLE RECORDS
@frappe.whitelist()
def get_list_of_available_records(doctype, filters, fields):
    available_record_list = frappe.get_all(
        doctype=doctype, filters=filters, fields=fields
    )
    return available_record_list

