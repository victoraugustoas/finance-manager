# Reporting context

## Use Cases

***

### C1. Breakdown of categories

#### Definition

It must return a list of categories with their respective totals.
The following filter parameters must be supported:

- Categories
- Start date
- End date
- Effectuated / not effectuated

#### C1. Business Rules

- BR1.
  - The list must be grouped by category.
  - Each category shows the sum of transaction amounts that belong to it.
- BR2.
  - The list must be ordered by amount, from highest to lowest.
- BR3.
  - If no category is provided, all categories must be returned.
  - A limit of six categories applies: an aggregate row holds the sum of the categories
    beyond the first-ranked positions.
  - The resulting list of up to six rows (including the aggregate row) must be ordered by
    descending amount per BR2 — that is, the aggregate row participates in the same ordering
    as individual categories and is not fixed in the last place solely because it is an aggregate.

*******
