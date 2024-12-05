import pandas as pd
import json
from collections import defaultdict

# Load CSV data
df = pd.read_csv("data_scopus.csv")

# Filter records with missing data
df = df.dropna(subset=["Year", "Authors", "Authors with affiliations"])

# Parse authors and affiliations
author_data = defaultdict(lambda: {"affiliation": None, "country": None, "degree": 0})
links = []

# Track publications by authors to create links
for index, row in df.iterrows():
    authors = row["Authors"].split(", ")
    affiliations = row["Authors with affiliations"].split("; ")

    # Extract authors and country affiliation
    valid_authors = []
    for i, author in enumerate(authors):
        if i < len(affiliations):
            aff = affiliations[i]
            country = aff.split(",")[-1].strip()  # Assume last part as country
            author_data[author]["affiliation"] = aff
            author_data[author]["country"] = country
            author_data[author]["degree"] += 1
            valid_authors.append(author)  # Only add authors with valid affiliations

    # Create links only between valid authors
    for i in range(len(valid_authors)):
        for j in range(i + 1, len(valid_authors)):
            links.append({"source": valid_authors[i], "target": valid_authors[j]})

# Convert to JSON format
# Only include nodes that are referenced in links
used_authors = {link["source"] for link in links}.union(
    {link["target"] for link in links}
)
nodes = [
    {"id": author, **data}
    for author, data in author_data.items()
    if author in used_authors
]
graph_data = {"nodes": nodes, "links": links}

# Save JSON data
with open("author_network.json", "w") as f:
    json.dump(graph_data, f)
