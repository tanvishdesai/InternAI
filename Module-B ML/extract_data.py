import pandas as pd
import json
from collections import Counter

# Read the CSV file
df = pd.read_csv('Module-B ML\internships.csv')

# Extract skills with counts
skills_counter = Counter()
for skill_str in df['preferred_skills'].dropna():
    skills_list = [s.strip() for s in skill_str.split(',')]
    skills_counter.update(skills_list)

# Extract locations with counts (cities and states)
cities_counter = Counter(df['location_city'].dropna())
states_counter = Counter(df['location_state'].dropna())
locations_counter = cities_counter + states_counter

# Extract sectors with counts
sectors_counter = Counter()
for sector_str in df['sector_tags'].dropna():
    sectors_list = [s.strip() for s in sector_str.split(',')]
    sectors_counter.update(sectors_list)

# Create data structure with counts
data = {
    'skills': [{'name': skill, 'count': count} for skill, count in sorted(skills_counter.items())],
    'locations': [{'name': location, 'count': count} for location, count in sorted(locations_counter.items())],
    'sectors': [{'name': sector, 'count': count} for sector, count in sorted(sectors_counter.items())]
}

# Save to JSON file
with open('extracted_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print('Extracted data saved to extracted_data.json')
print(f'Skills: {len(data["skills"])}')
print(f'Locations: {len(data["locations"])}')
print(f'Sectors: {len(data["sectors"])}')

# Print top 10 most common items in each category
print('\nTop 10 Skills:')
for item in sorted(skills_counter.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f'  {item[0]}: {item[1]}')

print('\nTop 10 Locations:')
for item in sorted(locations_counter.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f'  {item[0]}: {item[1]}')

print('\nTop 10 Sectors:')
for item in sorted(sectors_counter.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f'  {item[0]}: {item[1]}')
