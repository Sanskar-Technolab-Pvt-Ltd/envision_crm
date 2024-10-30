from frappe import _


def get_data(**kwargs):
    return {
        "fieldname": "prevdoc_docname",
        "non_standard_fieldnames": {
            "Auto Repeat": "reference_document",
        },
        "transactions": [
            {"label": _("Cost Estimation"), "items": ["Cost Estimation"]},
            {"label": _("Sales Order"), "items": ["Sales Order"]},
            {"label": _("Subscription"), "items": ["Auto Repeat"]},
        ],
    }
