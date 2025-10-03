// ? SETTING CUSTOM LISTVIEW CONFIGURATION FOR THE OPPORTUNITY DOCTYPE
frappe.listview_settings["Tender Opportunity"] = {
    // ? ADDITIONAL FIELDS TO FETCH IN LISTVIEW (REQUIRED FOR INDICATOR LOGIC)
	add_fields: ["status"],

    // ? FUNCTION TO DEFINE CUSTOM INDICATORS BASED ON THE STATUS FIELD
	get_indicator: function (doc) {

        // ? CHECK STATUS AND RETURN CORRESPONDING LABEL, COLOR, AND FILTER CONDITION
        if (doc.status === "Tender Invitation Received") {
            return [__("Tender Invitation Received"), "lightblue", "status,=,Tender Invitation Received"];
        } else if (doc.status === "Pre Bid Meeting Completed") {
            return [__("Pre Bid Meeting Completed"), "orange", "status,=,Pre Bid Meeting Completed"];
        } else if (doc.status === "Tender Not Quoted") {
            return [__("Tender Not Quoted"), "red", "status,=,Tender Not Quoted"];
        } else if (doc.status === "Tender Filling In-progress") {
            return [__("Tender Filling In-progress"), "orange", "status,=,Tender Filling In-progress"];
        } else if (doc.status === "Tender Submitted") {
            return [__("Tender Submitted"), "lightblue", "status,=,Tender Submitted"];
        } else if (doc.status === "Demo") {
            return [__("Demo"), "black", "status,=,Demo"];
        } else if (doc.status === "Technical Bid Opened") {
            return [__("Technical Bid Opened"), "darkblue", "status,=,Technical Bid Opened"];
        } else if (doc.status === "Technically Qualified") {
            return [__("Technically Qualified"), "green", "status,=,Technically Qualified"];
        } else if (doc.status === "Technically Disqualified") {
            return [__("Technically Disqualified"), "red", "status,=,Technically Disqualified"];
        }else if (doc.status === "Price Bid Opened") {
            return [__("Price Bid Opened"), "red", "status,=,Price Bid Opened"];
        }else if (doc.status === "Negotiation / Review") {
            return [__("Negotiation / Review"), "orange", "status,=,Negotiation / Review"];
        }else if (doc.status === "We are L1") {
            return [__("We are L1"), "green", "status,=,We are L1"];
        }else if (doc.status === "Closed Won - Tender") {
            return [__("Closed Won - Tender"), "green", "status,=,Closed Won - Tender"];
        }else if (doc.status === "Closed Lost to Competition") {
            return [__("Closed Lost to Competition"), "red", "status,=,Closed Lost to Competition"];
        }else if (doc.status === "Delayed / On Hold") {
            return [__("Delayed / On Hold"), "red", "status,=,Delayed / On Hold"];
        }else if (doc.status === "Gone for Re-Tendering") {
            return [__("Gone for Re-Tendering"), "orange", "status,=,Gone for Re-Tendering"];
        }else if (doc.status === "Tender Cancelled") {
            return [__("Tender Cancelled"), "black", "status,=,Tender Cancelled"];
        }
         else {
            return [__(doc.status), "gray", "status,=," + doc.status];
        }
    }
};
