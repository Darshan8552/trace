export type DemoSampleSource = {
  slug: string;
  title: string;
  filename: string;
  content: string;
};

export const DEMO_CHAT_TITLE = "Demo notebook";

export const DEMO_FIRST_QUESTION =
  "How long do customers have to request a refund on an annual plan?";

export const DEMO_SOURCES: DemoSampleSource[] = [
  {
    slug: "product-brief",
    title: "Cedar Desk product brief",
    filename: "cedar-desk-product-brief.txt",
    content: [
      "Cedar Desk product brief",
      "",
      "Cedar Desk is a shared inbox for small support teams. It keeps conversations, customer notes, and saved replies in one place so a team of two to twenty people can answer without forwarding email all day.",
      "",
      "The product launched in March 2025 after a six-month private beta with fourteen design partners. In the beta, teams handled an average of 180 conversations per week and cut their first-response time from nine hours to just under two.",
      "",
      "Core features",
      "- Shared inbox with assignment, mentions, and private notes.",
      "- Saved replies with variables for customer name, order number, and plan.",
      "- A daily digest that lists every conversation waiting on a teammate.",
      "- Search across subjects, message bodies, and notes.",
      "",
      "Pricing starts at 18 dollars per seat per month on the Team plan. The Business plan adds audit history, custom roles, and a shared analytics dashboard for 34 dollars per seat per month. Annual billing removes two months of cost.",
      "",
      "The roadmap for the rest of 2026 focuses on mobile, a public API, and a self-hosted option for regulated customers. The team is deliberately not building a full help center or a marketing automation suite.",
    ].join("\n"),
  },
  {
    slug: "refund-policy",
    title: "Cedar Desk refund policy",
    filename: "cedar-desk-refund-policy.txt",
    content: [
      "Cedar Desk refund policy",
      "",
      "This policy applies to every paid plan and every billing region.",
      "",
      "Monthly plans",
      "A monthly subscription can be cancelled at any time. The current month is not refunded, but future charges stop immediately. Unused days are not credited.",
      "",
      "Annual plans",
      "Annual plans can be refunded in full within 30 days of the original charge. After the first 30 days, the remaining unused months are refunded on a pro-rata basis, minus a 15 percent administrative fee. Refund requests must be sent from the workspace owner's email address to billing@cedardesk.example before the renewal charge, not after it.",
      "",
      "Duplicate and failed charges",
      "A duplicate charge is refunded in full as soon as it is confirmed. Failed charges are never billable and are removed from the next invoice.",
      "",
      "Seat changes",
      "Removing a seat mid-cycle produces a credit that is applied to the next invoice. Adding a seat is billed immediately at the pro-rata rate. Credits expire after 12 months and cannot be paid out in cash.",
      "",
      "Processing times",
      "Approved refunds are issued to the original payment method within 5 business days. Card refunds usually settle in 3 to 5 business days; bank transfers can take up to 10 business days depending on the bank.",
      "",
      "Questions about this policy go to billing@cedardesk.example. The policy was last updated on 14 April 2026.",
    ].join("\n"),
  },
  {
    slug: "plan-comparison",
    title: "Cedar Desk plan comparison",
    filename: "cedar-desk-plan-comparison.txt",
    content: [
      "Cedar Desk plan comparison",
      "",
      "| Capability | Free | Team | Business |",
      "| --- | --- | --- | --- |",
      "| Seats included | 2 | 3 | 10 |",
      "| Additional seat price | n/a | 18 USD | 34 USD |",
      "| Shared inbox | yes | yes | yes |",
      "| Saved replies | 5 | unlimited | unlimited |",
      "| Search history | 30 days | 12 months | 36 months |",
      "| Audit log | no | no | yes |",
      "| Custom roles | no | no | yes |",
      "| Analytics dashboard | no | no | yes |",
      "| Support | community | email | priority email |",
      "",
      "The Free plan is for evaluation only and is limited to 100 conversations per month. The Team plan is the default for support teams that answer every day. The Business plan is aimed at teams with more than eight seats, compliance requirements, or a need to review who changed what.",
      "",
      "Every plan stores data in the EU by default. US storage is available on the Business plan through a support request. All plans include daily backups and a 99.9 percent uptime target, measured monthly.",
      "",
      "Discounts: nonprofits receive 30 percent off the Team plan. Education accounts receive 50 percent off any plan. Discounts cannot be combined and are applied after annual billing.",
    ].join("\n"),
  },
];
