# Copyright (c) 2025, Prompt Group and contributors
# For license information, please see license.txt

# ? IMPORTING REQUIRED MODULES FROM FRAPPE AND PYTHON'S DATETIME LIBRARY
import frappe
from frappe import _
from datetime import datetime
from frappe.utils import getdate, add_days, nowdate, get_first_day, get_last_day
from datetime import timedelta, date, datetime


# ? MAIN EXECUTE FUNCTION FOR THE REPORT
def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


# ? FUNCTION TO DEFINE REPORT COLUMNS
def get_columns():
    # ? EACH COLUMN DICTIONARY DEFINES FIELDNAME, LABEL, TYPE, options, WIDTH, HEIGHT
    return [
        {
            'fieldname': 'tender_opportunity_name',
            'label': _('ID'),
            'fieldtype': 'Link',
            'options': 'Tender Opportunity',
            "width": 200,
            "height": 200,
        },
        {
            'fieldname': 'opportunity_name',
            'label': _('Tender Opportunity Name'),
            'fieldtype': 'Data',
            "width": 200,
            "height": 200,
        },
        {
            'fieldname': 'customer',
            'label': _('Customer'),
            'fieldtype': 'Data',
            "width": 200,
            "height": 200,
        },
        {
            'fieldname': 'opportunity_owner',
            'label': _('Tender Opportunity Owner'),
            'fieldtype': 'Link',
            'options': 'User',
            "width": 230,
            "height": 230,
        },
        {
            'fieldname': 'tender_source',
            'label': _('Tender Source'),
            'fieldtype': 'Link',
            "width": 150,
            "height": 150,
            "options": 'Tender Source'
        },
        {
            'fieldname': 'status',
            'label': _('Status'),
            'fieldtype': 'Data',
            "width": 220,
            "height": 220,
        },
        {
            'fieldname': 'probability',
            'label': _('Probability'),
            'fieldtype': 'Data',
            "width": 100,
            "height": 100,
        },
        {
            'fieldname': 'industry',
            'label': _('Industry'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'sector_segment',
            'label': _('Sector/Segment'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'submission_due_date',
            'label': _('Submission Due date'),
            'fieldtype': 'Date',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'actual_submission_date',
            'label': _('Actual Submission Date'),
            'fieldtype': 'Date',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'actual_technical_bid_opening_date',
            'label': _('Actual technical Bid Opening Date'),
            'fieldtype': 'Date',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'planned_opening_date',
            'label': _('Planned Opening Date'),
            'fieldtype': 'Date',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'emd_amount',
            'label': _('EMD Amount'),
            'fieldtype': 'Currency',
            "width": 150,
            "height": 150,
        },
        # {
        #     'fieldname': 'state',
        #     'label': _('State'),
        #     'fieldtype': 'Data',
        #     "width": 150,
        #     "height": 150,
        # },
        {
            'fieldname': 'product_category',
            'label': _('Product'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'qty',
            'label': _('Quantity'),
            'fieldtype': 'Int',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'rate',
            'label': _('Product Rate'),
            'fieldtype': 'Currency',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'amount',
            'label': _('Product Amount'),
            'fieldtype': 'Currency',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'bidder_name_1',
            'label': _('Bidder Name 1'),
            'fieldtype': 'Link',
            "width": 150,
            "height": 150,
            "options": 'Bidder'
        },
        {
            'fieldname': 'l1',
            'label': _('L1'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'bidder_name_2',
            'label': _('Bidder Name 2'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
            "options": 'Bidder'
        },
        {
            'fieldname': 'l2',
            'label': _('L2'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'bidder_name_3',
            'label': _('Bidder Name 3'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
            "options": 'Bidder'
        },
        {
            'fieldname': 'l3',
            'label': _('L3'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'bidder_name_4',
            'label': _('Bidder Name 4'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
            "options": 'Bidder'
        },
        {
            'fieldname': 'l4',
            'label': _('L4'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },
        {
            'fieldname': 'bidder_name_5',
            'label': _('Bidder Name 5'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
            "options": 'Bidder'
        },
        {
            'fieldname': 'l5',
            'label': _('L5'),
            'fieldtype': 'Data',
            "width": 150,
            "height": 150,
        },

    ]


# ? FUNCTION TO FETCH DATA BASED ON FILTERS
def get_data(filters):
    from_date = filters.get("from_date")
    to_date = filters.get("to_date")
    date_range = filters.get("date_range")
    query_filters = {}
    data = []

    # ? APPLYING STATUS, CUSTOMER, AND OWNER FILTERS IF PRESENT
    if filters.get("status"):
        query_filters["status"] = filters.get("status")

    if filters.get("customer"):
        query_filters["party"] = filters.get("customer")

    if filters.get("opportunity_owner"):
        query_filters["opportunity_owner"] = filters.get("opportunity_owner")

    # ? DATE RANGE FILTER HANDLING
    if date_range == "today_only":
        today = datetime.today().strftime("%Y-%m-%d")
        query_filters["creation"] = [">=", today]
    elif date_range == "yesterday":
        yesterday = (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        query_filters["creation"] = ["between", [yesterday, yesterday]]
    elif date_range == "this_week":
        start_of_week = (
                datetime.today() - timedelta(days=datetime.today().weekday())
        ).strftime("%Y-%m-%d")
        query_filters["creation"] = [
            "between",
            [start_of_week, datetime.today().strftime("%Y-%m-%d")],
        ]
    elif date_range == "last_week":
        end_of_last_week = datetime.today() - timedelta(days=datetime.today().weekday())
        start_of_last_week = end_of_last_week - timedelta(days=6)
        query_filters["creation"] = [
            "between",
            [start_of_last_week.strftime("%Y-%m-%d"), end_of_last_week.strftime("%Y-%m-%d")],
        ]
    elif date_range == "this_month":
        start_of_month = datetime.today().replace(day=1).strftime("%Y-%m-%d")
        query_filters["creation"] = [">=", start_of_month]
    elif date_range == "last_month":
        first_day_of_current_month = datetime.today().replace(day=1)
        last_day_of_last_month = first_day_of_current_month - timedelta(days=1)
        start_of_last_month = last_day_of_last_month.replace(day=1).strftime("%Y-%m-%d")
        end_of_last_month = last_day_of_last_month.strftime("%Y-%m-%d")
        query_filters["creation"] = ["between", [start_of_last_month, end_of_last_month]]
    elif date_range == "last_15_days":
        last_15_days = (datetime.today() - timedelta(days=15)).strftime("%Y-%m-%d")
        query_filters["creation"] = [">=", last_15_days]
    elif date_range == "this_year":
        start_of_year = datetime.today().replace(month=1, day=1).strftime("%Y-%m-%d")
        query_filters["creation"] = [">=", start_of_year]

    # ? VALIDATE DATE RANGE
    today = date.today()

    if from_date:
        from_date = parse_date(from_date)
    if to_date:
        to_date = parse_date(to_date)

    if from_date and from_date > today:
        frappe.throw(_("From Date should not be a future date"))
    elif to_date and to_date > today:
        frappe.throw(_("To Date should not be a future date"))
    elif from_date and to_date and from_date > to_date:
        frappe.throw(_("From Date should not be greater than To Date"))

    # ? APPLY DATE FILTERS AFTER VALIDATION
    if from_date and to_date:
        query_filters["creation"] = ["between", [from_date, to_date]]
    elif from_date:
        query_filters["creation"] = [">=", from_date]
    elif to_date:
        query_filters["creation"] = ["<=", to_date]

    # ? FETCH MAIN RECORDS FROM TENDER OPPORTUNITY
    tender_opportunity = frappe.get_all(
        "Tender Opportunity",
        filters=query_filters,
        fields=[
            "opportunity_owner",
            "status",
            "name",
            "probability",
            "industry",
            "sector_segment",
            "submission_due_date",
            "actual_submission_date",
            "actual_technical_bid_opening_date",
            "planned_opening_date",
            "emd_amount",
            "party",
            "tender_source",
            "opportunity_name"
        ]
    )

    # ? LOOP THROUGH EACH TENDER OPPORTUNITY RECORD
    for to in tender_opportunity:
        to_doc = frappe.get_doc("Tender Opportunity", to.name)

        # ? FETCH ONE RELATED SUBMITTED QUOTATION (docstatus = 1)
        quotation_name = frappe.get_value(
            "Quotation",
            filters={
                "custom_tender_opportunity": to_doc.name,
                "docstatus": 1
            },
            fieldname="name"
        )

        items = []
        if quotation_name:
            quotation_doc = frappe.get_doc("Quotation", quotation_name)
            items = quotation_doc.items

        bidders = to_doc.bidders_information or []

        l1 = l2 = l3 = l4 = l5 = ""
        bidder_name_1 = bidder_name_2 = bidder_name_3 = bidder_name_4 = bidder_name_5 = ""

        # ? MAP BIDDER NAMES TO CORRECT LX COLUMN BASED ON STATUS
        for bidder in bidders:
            status = bidder.status.strip().upper() if bidder.status else ""
            if status == "L1":
                l1 = bidder.quoted_amount
                bidder_name_1 = bidder.bidder_name
            elif status == "L2":
                l2 = bidder.quoted_amount
                bidder_name_2 = bidder.bidder_name
            elif status == "L3":
                l3 = bidder.quoted_amount
                bidder_name_3 = bidder.bidder_name
            elif status == "L4":
                l4 = bidder.quoted_amount
                bidder_name_4 = bidder.bidder_name
            elif status == "L5":
                l5 = bidder.quoted_amount
                bidder_name_5 = bidder.bidder_name

                # ? COMBINE DATA FROM BIDDERS AND ITEMS CHILD TABLES
        item_filters = filters.get("product")

        if items:
            for idx, i in enumerate(items):
                include_bidder_data = (idx == 0)

                if item_filters and i.item_code != item_filters:
                    continue

                row = {
                    "tender_opportunity_name": to.name,
                    "status": to.status,
                    "probability": to.probability,
                    "opportunity_owner": to.opportunity_owner,
                    "industry": to_doc.industry,
                    "sector_segment": to_doc.sector_segment,
                    "submission_due_date": to_doc.submission_due_date,
                    "actual_submission_date": to_doc.actual_submission_date,
                    "actual_technical_bid_opening_date": to_doc.actual_technical_bid_opening_date,
                    "planned_opening_date": to_doc.planned_opening_date,
                    "emd_amount": to_doc.emd_amount,
                    "bidder_name_1": bidder_name_1 if include_bidder_data else "",
                    "bidder_name_2": bidder_name_2 if include_bidder_data else "",
                    "bidder_name_3": bidder_name_3 if include_bidder_data else "",
                    "bidder_name_4": bidder_name_4 if include_bidder_data else "",
                    "bidder_name_5": bidder_name_5 if include_bidder_data else "",
                    "l1": l1 if include_bidder_data else "",
                    "l2": l2 if include_bidder_data else "",
                    "l3": l3 if include_bidder_data else "",
                    "l4": l4 if include_bidder_data else "",
                    "l5": l5 if include_bidder_data else "",
                    "product_category": i.item_code if i else "",
                    "qty": i.qty if i else 0,
                    "rate": i.rate if i else 0,
                    "amount": i.amount if i else 0,
                    "customer": to_doc.party,
                    # "state": to_doc.state,
                    "tender_source": to_doc.tender_source,
                    "opportunity_name": to_doc.opportunity_name
                }
                data.append(row)

        else:
            if item_filters:
                continue

            row = {
                "tender_opportunity_name": to.name,
                "status": to.status,
                "probability": to.probability,
                "opportunity_owner": to.opportunity_owner,
                "industry": to_doc.industry,
                "sector_segment": to_doc.sector_segment,
                "submission_due_date": to_doc.submission_due_date,
                "actual_submission_date": to_doc.actual_submission_date,
                "actual_technical_bid_opening_date": to_doc.actual_technical_bid_opening_date,
                "planned_opening_date": to_doc.planned_opening_date,
                "emd_amount": to_doc.emd_amount,
                "bidder_name_1": bidder_name_1 or "",
                "bidder_name_2": bidder_name_2 or "",
                "bidder_name_3": bidder_name_3 or "",
                "bidder_name_4": bidder_name_4 or "",
                "bidder_name_5": bidder_name_5 or "",
                "l1": l1 or "",
                "l2": l2 or "",
                "l3": l3 or "",
                "l4": l4 or "",
                "l5": l5 or "",
                "product_category": "",
                "qty": 0,
                "rate": 0,
                "amount": 0,
                "customer": to_doc.party,
                # "state": to_doc.state,
                "tender_source": to_doc.tender_source,
                "opportunity_name": to_doc.opportunity_name
            }
            data.append(row)

        # include_bidder_data = (idx == 0)
        # bidder = bidders[i] if i < len(bidders) else None
        # item = items[i] if i < len(items) else None

    return data


# ? CONVERT TO DATETIME OBJECTS (IF THEY ARE STRINGS)
def parse_date(d):
    return datetime.strptime(d, "%Y-%m-%d").date() if isinstance(d, str) else d
