Product Requirements Document  
The starting point of your entire app. Before anyone writes a single line of code or designs a single screen — this doc answers what are we bullding and why?  
WHAT IT CONTAINS  
Problem statement  
What problem does this solve?  
Who faces it? Why does it matter? Plain English, no jargon.  
Target users  
Who is this for? Age, tech comfort, frustrations, and goals of your typical user.  
Product vision  
One or two lines. The north star of your app-what It will ultimately become.  
8  
Core features  
Every feature with a name, description, and label -  
must-have  
nice-to-have  
S  
App flow  
Step-by-step user Journey. Every screen, button, and decision point in plain language.  
Success metrics  
How do you know It's working?  
Signups, tasks completed, time spent - defined upfront.  
9 PROMPT TO GENERATE THIS DOCUMENT  
"Act as a senior product manager with experience in early-stage startups. I am building an app and I need you to create a detailed Product Requirements Document for it. The document should cover - what the app does, who it is for, what problem it solves, all core features with must-have vs nice-to-have classification, how a user flows through the app from start to finish, what the MVP looks like, how success will be measured, and what we are dellberately NOT building in version one.  
On My website   
  
  
  
  
Technical Architecture Document  
The engineering blueprint of your app. Tells the Al - and any developer - exactly what tools are being used, how the project is organized, and how data is structured. Without this, Al makes random technical decisions that contradict each other.  
WHAT IT CONTAINS  
Tech stack  
Every technology being used - frontend, backend, database, hosting, auth - named explicitly with versions.  
File & folder structure  
A map of how the project is organized. Which folder holds which type of file. Keeps the codebase consistent.  
田  
Database schema  
Every table, every field, every relationship. Think of it Ilke describing an Excel sheet in plain English.  

|  | Environment & config           |
| - | ------------------------------ |
|  | What env variables are needed, |
|  | what keys to set up, and what  |
|  | should never be hardcoded.     |
|  | Keeps things secure.           |
  
• PROMPT TO GENERATE THIS DOCUMENT  
"Act as a senior software architect who has built and scaled multiple SaaS products. Based on my app idea, create a complete Technical Architecture Document. It should include the recommended tech stack with reasoning for each choice, the complete file and folder structure of the project, the full database schema with all tables, flelds, and relationships explained in plain English, and any environment variables or configuration notes i need to be aware of before I start building. On my website   
  
  
  
Security & Access Document  
Defines who can do what inside your app - and what happens when things go wrong. Most vibe coders skip this entirely and then wonder why random users can access admin panels or why the app crashes on bad input.  
WHAT IT CONTAINS  
C  
Authentication method  
How users log in - email + password, Google Auth, OTP, magic link. Clearly defined here.  
User roles & permissions  
Admin, regular user, guest - what each role can see, do, and what is blocked from them.  
Row-level security  
Who can read whose data in the database. A user should only see their own records - never others'.  
Error handling  
What happens when things break - API down, wrong password, payment falls. Every failure gets a defined response.  
Edge cases  
Empty forms, unauthorized access, slow connections - all the weird stuff handled before launch.  
8 PROMPT TO GENERATE THIS DOCUMENT  
"Act as a senior security engineer who specializes in early-stage product security. Create a Security and Access Document for my app. It should cover the authentication method that best fits my use case, all user roles and exactly what each role can and cannot do, row-level security rules for the database, a complete error handling guide for all major fallure points, and a list of edge cases I need to handle before launch. Write everything in plain English so a non-technical founder can understand it. On my website   
  
  
  
  
Frontend Specification Document  
Makes sure your app looks and feels consistent across every screen. Also tells the Al exactly which external services are connected and how to talk to them. Without this, every screen looks different and Integrations get guessed wrong.  
WHAT IT CONTAINS  
P  
Color palette  
Exact brand colors with hex codes - primary, secondary, background, text, error, success.  
All defined.  
A  
Typography  
Which fonts, at what sizes, for what purpose - headings, body, buttons. All specified upfront.  
Component styles  
How buttons, Inputs, cards, and modals look. So every Al-generated screen matches the same design.  
Spacing & layout  
Padding, margins, grid system.  
How much space between elements. Keeps Ul from looking random or cramped.  
API & integrations  
Every third party service - Stripe, Firebase, OpenAl. What It does, which endpoints, what goes in and comes back.  
9 PROMPT TO GENERATE THIS DOCUMENT  
"Act as a senior Ul/UX designer and frontend architect. Create a Frontend Specification Document for my app. It should define a complete design system including color palette with hex codes, typography choices, component styles for buttons, Inputs, cards and modals, and spacing and layout rules. It should also Include a full API and Integration spec for every third party service my app will use - what each service does, which endpoints are called, what data Is sent and what response Is expected.  
  
  
  
Feature name  
Short and clear - "User login page*, "Dashboard screen",  
"Stripe checkout flow."  
Task description  
Exactly what needs to happen.  
Written as if telling someone who has never seen your app before.  
Acceptance criteria  
How do you know this is done?  
"User can log in." "Error shows on wrong password." No ambiguity.  
Dependencies  
Does this task need another completed first? Prevents building features in the wrong order.  
Priority  
Must-have for launch, should-have, or nice-to-have. Keeps you focused on shipping, not over-bullding.  
• This is the only doc where you paste your PRD - not your raw idea. By the time you're making tickets, your PRD already exists. That's the system working in order.  
R PROMPT TO GENERATE THIS DOCUMENT  
"Act as a senior engineering lead who breaks down products into bulldable tasks. Based on my PRD, create a complete Feature Ticket List for my app. For each feature, write a ticket that includes the feature name, a clear description of what needs to be built, acceptance criteria that defines when the task is done, any dependencies on other features that must be completed first, and a priority label - must-have for launch, should-have, or nice-to-have. Write each ticket so it can be directly used as a prompt for an Al coding tool.  
  
  
  
  

|  | Hide APikeys |  | Test
11. SoL Injection |
| --- | ---------------------------------------------------- | - | ---------------------------------- |
|  | 2. Enable RLS |  | Remove
12o sensitive logs |
|  | 3. Test IDOR attacks |  | Block field
130 Bampering |
|  | 4. Scan GIT secrets |  | 14o Restrict file uploads |
|  | 5. Lock admin routes |  | Secure
15. server logic |
|  | 6. Test user isolation |  | Trim API
16. responses |
|  | 7. Rate limit API'S |  | 17o Secure auth sessions |
|  | 8. Lock storage |  | 18. Scan dependencies |
| 10. | buckets
9. Validate all inputs
Block unauthenticated |  | 19. Test record access
Attack your |
  
  

|  | 1. Privacy policy page        | 11. Compress your images     |
| - | ----------------------------- | ---------------------------- |
|  | 2. Terms & conditions page    | 12 Check page load speed     |
|  | 3. Secrets off the frontend   | 13. Fix color contrast       |
|  | 4 Force HTTPS                 | 14. Make it mobile friendly  |
|  | 5. Cookie consent banner      | 15. Custom 404 page          |
|  | 6. Meta titles + descriptions | 16. Fix broken links         |
|  | 7o Social preview image       | 17 Form validation           |
|  | 8. Add afavicon               | 18. Spam protection          |
|  | 9. Sitemap + robots. txt      | 19. Set upanalytics          |
|  | 10. Alt texton images         | 20. One clear call to action |
  
  
Attack my authentication Like you want in. Walk every auth path in this repo:  
1.    List every route and API endpoint and whether it verifies a valid session. Flag any that skip it.  
2.    Session handling: where tokens Live, whether they expire, whether Logout and password change kill them  
3.    Password rules: minimum length, breached-password check, anything my auth provider offers that I left off  
4.    Password reset and email verification: can I reset someone else's password, or use the app with an unverified email?  
Output: flow | weakness | exact exploit steps I severity I fix.  
Any endpoint that trusts a user ID from the request body instead of the session  
  
  
  
$ Act as a security researcher auditing my repo for exposed secrets. Find:  
1.    Hardcoded API keys, tokens, passwords, or connection strings in any file  
2.   . env files that are committed or missing from •gitignore  
3.    Secrets in git history even if the file was deleted later  
4.    Secrets that ship to the browser in frontend code or build output  
5.    Public/anon keys doing privileged work  
Output a table: file and line | what leaked | how an attacker finds it l severity (CRITICAL / HIGH / MEDIUM) | exact fix.  
Then list every key I need to rotate. A key that ever touched a commit is burned, hiding it now is not enough.  
  
  
$ Audit my database access rules table by table (Supabase RLS or equivalent).  
1.    List every table and whether RLS is enabled. Any table reachable with the public key and no RLS is CRITICAL.  
2.    For each policy, write the exact query user A runs to read or edit user B's rows, and tell me whether it works.  
3.    Flag policies that filter on values the client sends instead of auth.vid().  
4.    Check INSERT and UPDATE policies, not just SELECT: can I insert rows pointed at another user, or update columns I shouldn't own, like role or credits?  
5.    Apply the same checks to storage buckets.  
Output: table | policy state | the attack query | what leaks | severity l corrected policy as real SQL.  
  
  
  
  
$ Trace every path where user input reaches something dangerous in this repo:  
1. SQL or NoSQL queries built with string concatenation or template literals instead of parameters  
Input passed to eval, exec, child_process, or shell commands  
1.    File uploads: is the filename sanitized, is the type verified server-side, can I upload an executable or path-traverse with ../  
2.    User content rendered as HTML without escaping, including dangerouslySetInnerHTML and markdown renderers  
3.    Endpoints with no server-side validation at all  
Output: file and line | input source | what it reaches | a working example payload | severity | fix.  
  
  
  
  
  
$ Find every endpoint in this app that costs me money or resources when called, and check its protection:  
1.    Routes that trigger AI or LLM API calls: what stops a script from calling each one 100,000 times tonight? Check auth, per-user limits, per-IP limits.  
2.    Login, signup, and password reset: rate limits, bot protection, and whether response differences let someone enumerate valid emails Email or sMs sending routes someone can spam through Expensive queries or exports with no caps or pagination  
5. Usage metering: is it enforced server-side, and does it fail closed?  
Output: endpoint | what one call costs me | the abuse scenario l projected damage from one night | severity | the exact limiter to add.  
  
  
  
  
  
  
