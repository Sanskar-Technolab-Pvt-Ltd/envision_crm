<p>
  This is a reminder that the submission deadline for the tender opportunity 
  <strong><a href="{{ frappe.utils.get_url() }}/app/tender-opportunity/{{ doc.name }}" target="_blank">{{ doc.name }}</a></strong> is approaching.
</p>

<p>
  Please ensure that all necessary documents and requirements are completed and submitted before the deadline to avoid disqualification.
</p>

<ul>
  {% if doc.opportunity_name %}
    <li><strong>Opportunity Name:</strong> {{ doc.opportunity_name }}</li>
  {% endif %}
  {% if doc.party %}
  <li><strong>Customer:</strong> {{ doc.party }}</li>
  {% endif %}
  {% if doc.submission_due_date %}
  <li><strong>Submission Due Date:</strong> {{ doc.submission_due_date }}</li>
  {% endif %}
</ul>

<p>
  You can view the tender details and submit your documents by clicking the link above.
</p>
