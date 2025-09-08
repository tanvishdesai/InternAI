# 📝 Detailed Prompt for Generating Better Internships.csv

## 🎯 **OBJECTIVE**
Generate a high-quality synthetic internships.csv file with 200 diverse, realistic internship opportunities that will work excellently with the content-based recommendation system. The data should maximize recommendation quality by ensuring:

1. **Rich semantic embeddings** (60% of recommendation score)
2. **Clear skill-job alignment** (15% of recommendation score)
3. **Proper qualification matching** (8% of recommendation score)
4. **Diverse location coverage** (12% of recommendation score)
5. **Realistic sector distribution** (5% of recommendation score)

---

## 📋 **REQUIRED CSV SCHEMA (EXACT COLUMN NAMES)**

```csv
internship_id,title,organization,sector_tags,description,responsibilities,required_qualifications,preferred_skills,stipend,location_city,location_district,location_state,location_pincode,remote_allowed,duration_weeks,start_date,application_deadline,eligibility_min_qualification,url,posted_date,source,one_line_summary
```

---

## 🎨 **DATA GENERATION REQUIREMENTS**

### **1. DIVERSITY REQUIREMENTS**
- **200 unique internships** (IDs: INT2000 to INT2199)
- **15-20 organizations** (mix of NGOs, corporates, startups, government bodies)
- **Geographic coverage**: All major Indian states with realistic city/district combinations
- **Sector distribution**:
  - Technology: 25%
  - Education: 15%
  - Healthcare/Medicine: 12%
  - Agriculture/Rural Development: 10%
  - Finance/Accounting: 8%
  - Media/Communications: 8%
  - Research/Analytics: 7%
  - Environment/Sustainability: 6%
  - Governance/Public Policy: 5%
  - Arts/Culture: 4%

### **2. SKILL ECOSYSTEM (MUST USE THESE NORMALIZED SKILLS)**
```
Technical: python, javascript, java, c++, sql, r, matlab, excel, tableau, power_bi, aws, azure, gcp, docker, kubernetes, react, angular, node.js, django, flask, tensorflow, pytorch, opencv, git, linux, android, ios

Data & Analytics: data_analysis, machine_learning, statistics, data_visualization, business_intelligence, predictive_modeling, a_b_testing, data_mining

Design & Creative: figma, adobe_photoshop, adobe_illustrator, adobe_indesign, canva, sketch, ui_ux_design, graphic_design, video_editing, animation

Business & Management: project_management, stakeholder_management, business_analysis, strategic_planning, marketing, digital_marketing, content_writing, social_media, seo, market_research

Research & Academic: research_methodology, qualitative_research, quantitative_research, academic_writing, literature_review, survey_design, impact_evaluation

Domain Specific: healthcare_management, agricultural_economics, financial_modeling, policy_analysis, environmental_science, teaching, curriculum_development, community_development
```

### **3. QUALIFICATION LEVELS**
- `12th`: High school graduates
- `diploma`: Technical diploma holders
- `ug`: Undergraduate students (Bachelor's)
- `pg`: Postgraduate students (Master's/PhD)

---

## 🔧 **CONTENT QUALITY REQUIREMENTS**

### **4. TITLE REQUIREMENTS**
- **Specific and descriptive** (NOT generic)
- ❌ "Data Analysis Intern" → ✅ "Machine Learning Research Intern"
- ❌ "Community Outreach Intern" → ✅ "Rural Health Education Coordinator"
- ❌ "Web Development Intern" → ✅ "Frontend Developer - React Applications"

### **5. DESCRIPTION REQUIREMENTS**
- **200-400 words** per internship
- **Specific, detailed, and unique**
- Include: **context, impact, specific technologies/tools, learning outcomes**
- ❌ Generic: "work closely with team to execute project activities"
- ✅ Specific: "Develop predictive models for crop yield optimization using satellite imagery and machine learning algorithms. Work with agricultural economists to validate model accuracy and deploy solutions for 500+ farmers."

### **6. RESPONSIBILITIES REQUIREMENTS**
- **4-8 specific, measurable responsibilities**
- Use **action verbs** and **quantifiable outcomes**
- ❌ "data collection; report writing"
- ✅ "Conduct field surveys with 50+ farmers weekly; Analyze satellite imagery datasets using Python and GIS tools; Develop predictive models achieving 85% accuracy; Present findings to stakeholders through data visualizations"

### **7. SKILL ALIGNMENT RULES**
- **Perfect job-skill matching** (critical for 15% scoring weight)
- **3-6 relevant skills** per internship
- **Progressive difficulty**: Entry-level roles use basic skills, senior roles use advanced skills
- **Technology stack coherence**: Related technologies together

### **8. SECTOR ALIGNMENT RULES**
- **Logical sector-job combinations**
- **Real-world relevance**: Sectors should match actual NGO/corporate work
- **Cross-sector opportunities**: Some roles can span multiple sectors

---

## 📊 **SAMPLE INTERNSHIP PROFILES**

### **Technology Sector Example:**
```
Title: "AI/ML Engineer Intern"
Organization: "AgriTech Solutions"
Sector Tags: "technology,agriculture"
Skills: "python,machine_learning,tensorflow,data_analysis,git"
Description: "Join our AI team to develop computer vision models for crop disease detection. You'll work with drone imagery, implement deep learning algorithms, and contribute to real-world agricultural solutions serving thousands of farmers."
```

### **Healthcare Sector Example:**
```
Title: "Health Data Analyst Intern"
Organization: "Rural Health Initiative"
Sector Tags: "healthcare,research"
Skills: "sql,data_analysis,tableau,statistics,excel"
Description: "Analyze healthcare data from rural clinics to identify disease patterns and improve resource allocation. Create dashboards for health administrators and contribute to evidence-based policy recommendations."
```

### **Education Sector Example:**
```
Title: "EdTech Content Developer Intern"
Organization: "Digital Learning Foundation"
Sector Tags: "education,technology"
Skills: "content_writing,ui_ux_design,figma,video_editing,research_methodology"
Description: "Design interactive learning modules for underprivileged students. Research educational methodologies, create multimedia content, and test user engagement metrics to improve learning outcomes."
```

---

## 🎯 **RECOMMENDATION OPTIMIZATION**

### **9. Semantic Richness for Embeddings**
- **Domain-specific terminology** that matches candidate profiles
- **Technology stack mentions** that align with skill preferences
- **Impact statements** that resonate with career goals
- **Learning outcome descriptions** that match education levels

### **10. Location Strategy**
- **Tier 1 cities**: Bangalore, Mumbai, Delhi, Chennai, Kolkata, Hyderabad, Pune
- **Tier 2 cities**: Jaipur, Ahmedabad, Lucknow, Bhubaneswar, Chandigarh, Guwahati
- **Rural/remote**: Mix of actual district names with remote_allowed=yes
- **Geographic balance**: Ensure coverage across all major states

### **11. Stipend Realism**
- **NGO sector**: ₹0-5000/month (many unpaid)
- **Corporate**: ₹5000-15000/month
- **Tech startups**: ₹8000-20000/month
- **Premium opportunities**: ₹15000-30000/month

### **12. Timing Distribution**
- **Start dates**: Mix of immediate (next 2 weeks) and future (1-3 months)
- **Deadlines**: 2-4 weeks before start date
- **Posted dates**: Spread across last 3 months
- **Duration**: 4-24 weeks (realistic internship lengths)

---

## 📋 **QUALITY ASSURANCE CHECKLIST**

### **Before Finalizing CSV:**

1. **✅ Skill-Job Alignment**: Every internship's skills must logically match its title and description
2. **✅ Sector Relevance**: Sector tags must align with organization type and work description
3. **✅ Location Realism**: All city/district/state combinations must be accurate
4. **✅ Description Uniqueness**: No two internships should have similar generic descriptions
5. **✅ Qualification Logic**: Required qualifications should match role complexity
6. **✅ Stipend Appropriateness**: Compensation should match organization type and role level
7. **✅ Diversity Check**: Ensure variety across all dimensions (sectors, skills, locations, org types)

### **Testing Recommendations:**
1. **Create test profiles** for different candidate types (CS student, Commerce graduate, Rural background, etc.)
2. **Verify semantic matching** works well with rich descriptions
3. **Check skill overlap scoring** provides meaningful differentiation
4. **Test location matching** across different geographic preferences
5. **Validate qualification filtering** works as expected

---

## 🚀 **GENERATION INSTRUCTIONS**

**Output Format**: Pure CSV content (no markdown, no explanations)
**Row Count**: Exactly 200 internships
**Encoding**: UTF-8
**Date Format**: YYYY-MM-DD
**ID Format**: INT2000, INT2001, ..., INT2199

**Focus Areas for LLM**:
1. **Write compelling, specific descriptions** that create rich semantic embeddings
2. **Ensure perfect skill-job alignment** for effective recommendation scoring
3. **Create realistic, diverse scenarios** that reflect actual internship opportunities
4. **Balance all parameters** (location, stipend, duration, qualifications) appropriately
5. **Use domain-specific language** that matches how candidates describe their interests

---

## 🎯 **SUCCESS CRITERIA**

The generated data should result in:
- **Clear, specific recommendations** instead of vague matches
- **High skill overlap scores** for relevant candidate profiles
- **Meaningful semantic similarity** between profiles and internships
- **Diverse, realistic opportunities** across different sectors and locations
- **Proper qualification filtering** that respects education levels
- **Geographic flexibility** with appropriate remote work options
