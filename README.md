# AI SDR Agent: Autonomous Prospect Researcher 🤖🚀

An agentic AI system designed to automate the heavy lifting of sales development. This agent autonomously scrapes a prospect's LinkedIn profile, researches their company's latest news, and synthesizes that data into a hyper-personalized, high-conversion outreach email.

---

## 📖 Project Description
In the modern sales landscape, generic "spray and pray" email templates are no longer effective. High-value prospects expect relevance. The **AI SDR Agent** is a sophisticated tool that moves beyond simple automation into **Agentic AI**. It uses a "Reasoning and Acting" (ReAct) loop to perform deep research across multiple data sources before drafting a single word of outreach.

### What it does:
*   **Prospect Intelligence:** It navigates to a provided LinkedIn URL and extracts the prospect's current role, career history, key skills, and "About" section to understand their professional identity.
*   **Real-Time Contextual Search:** It identifies the prospect's current company and uses specialized search tools (like Tavily) to find recent news articles, press releases, or funding announcements from the last 30 days.
*   **Creative Synthesis:** Using a "Sales Strategist" persona, the LLM identifies a "hook"—a logical bridge between the prospect's specific experience and a current company event—to create an email that feels 100% manually researched.

---

## 🏗️ Technical Architecture & Deep Details

The system follows a **Modular Agent** design pattern, ensuring that each component can be scaled or swapped independently[cite: 1].

### 1. The Orchestrator (LangChain / CrewAI)
The central logic engine that manages the state[cite: 1]. It uses **Function Calling** to determine when it has enough information to proceed[cite: 1]. If the LinkedIn scrape fails, the agent can "decide" to try a different search strategy to find the prospect[cite: 1].

### 2. The Scraper Tool (LinkedIn Extraction)
*   **Challenge:** LinkedIn has aggressive anti-bot measures[cite: 1].
*   **Solution:** This project utilizes **Proxycurl API** or **ScrapingBee** to handle headless browser rendering, proxy rotation, and cookie management, returning clean JSON data representing the user profile[cite: 1].

### 3. The Search Tool (Tavily AI)
*   **Function:** Standard Google searches are too noisy for agents[cite: 1].
*   **Optimization:** This tool uses **Tavily**, which is optimized for LLMs[cite: 1]. It filters for "News" specifically and returns content chunks that are pre-processed for RAG (Retrieval-Augmented Generation)[cite: 1].

### 4. The Intelligence Layer (GPT-4o / Claude 3.5)
*   **Prompt Engineering:** The agent is given a specific system prompt that enforces a "No Fluff" rule[cite: 1].
*   **Output Quality:** This ensures the generated emails avoid stereotypical AI language (like "I hope this email finds you well") and focus on direct value[cite: 1].

---

## 🛠️ Tech Stack
*   **Language:** Python 3.11+[cite: 1]
*   **Agent Framework:** [LangChain](https://python.langchain.com/) or [CrewAI](https://www.crewai.com/)[cite: 1]
*   **Large Language Model:** OpenAI GPT-4o[cite: 1]
*   **Search Engine:** [Tavily AI](https://tavily.com/)[cite: 1]
*   **Data Extraction:** [Proxycurl API](https://nubela.co/proxycurl/)[cite: 1]
*   **Environment Management:** `python-dotenv` for secure API key handling[cite: 1]

---

## 🚀 Installation & Setup

### 1. Clone & Environment
```bash
git clone [https://github.com/yourusername/AI-SDR-Agent.git](https://github.com/yourusername/AI-SDR-Agent.git)
cd AI-SDR-Agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
### 2. Configuration
Create a `.env` file in the root directory to securely store your credentials:

```env
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key
PROXYCURL_API_KEY=your_proxycurl_key
```
### 3. Execution
Run the agent from your terminal by providing a target LinkedIn profile URL:

```bash
python main.py --url "[https://www.linkedin.com/in/prospect-name](https://www.linkedin.com/in/prospect-name)"
```
## 📈 Expected Output Workflow
* **Input:** LinkedIn URL[cite: 1].
* **Agent Action:** Scrapes profile -> Finds "Software Architect at CloudScale"[cite: 1].
* **Agent Action:** Searches news -> Finds "CloudScale acquires DataVault for $200M"[cite: 1].
* **Final Output:**
    * **Subject:** Thoughts on the DataVault acquisition[cite: 1]
    * **Body:** "Hi [Name], I've been following your work on distributed systems at CloudScale. With the news of the DataVault acquisition yesterday, I imagine your team is facing some interesting integration challenges. Given your background in..."[cite: 1]

---

## ⚖️ Ethics & Compliance
This tool is built for educational and productivity purposes[cite: 1]. Users must ensure:
* **Compliance:** Strict adherence to LinkedIn's Terms of Service[cite: 1].
* **Regulation:** Compliance with GDPR and CAN-SPAM regulations regarding cold outreach[cite: 1].
* **Review:** Ethical use of AI-generated content—always review and edit drafts before sending[cite: 1].
