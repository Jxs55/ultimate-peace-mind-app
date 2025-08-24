# ultimate-peace-mind-app

A Next.js application designed to help users organize their tasks and improve productivity.  This application leverages Google Gemini's powerful AI capabilities to intelligently classify and categorize user input, transforming unstructured thoughts into actionable tasks.

## Features

* **Brain Dump:**  A free-form text input area where users can jot down their thoughts and ideas.
* **AI-Powered Task Classification:**  Utilizes the Google Gemini API to analyze the brain dump text and extract individual tasks, automatically assigning categories, priorities, and estimated effort.
* **Task Management:**  Provides a comprehensive task management system with features including:
    * Task creation, editing, and deletion.
    * Subtask management.
    * Priority levels (high, medium, low).
    * Status tracking (todo, in-progress, done).
    * Categorization (Universidad, Aprender a Manejar, Cocinar, Programación, and custom categories).
    * Detailed task views with notes and additional information.
* **Multiple Views:** Offers different views for task management, including:
    * Task List: A simple list view of all tasks.
    * Kanban Board: A visual Kanban board for managing tasks by status.
* **Robust Error Handling:** Includes fallback mechanisms for cases where the AI fails to process the input, ensuring a smooth user experience.


## Technologies Used

* **Next.js:**  React framework for building the user interface.
* **TypeScript:**  For static typing and improved code maintainability.
* **Google Gemini API:**  For AI-powered task classification.
* **Tailwind CSS:**  For rapid UI development.