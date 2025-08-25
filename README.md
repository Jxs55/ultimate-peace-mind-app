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

## DESCRIPTION OF THE PROJECT

Esta aplicación, llamada "ultimate-peace-mind-app", es una plataforma web desarrollada con Next.js y TypeScript, diseñada para ayudar a los usuarios a organizar sus pensamientos y tareas de manera eficiente y moderna. Su principal innovación es el uso de inteligencia artificial (Google Gemini) para analizar textos libres ("brain dump") y convertirlos automáticamente en tareas estructuradas, asignando categorías, prioridades y esfuerzo estimado.

El usuario puede escribir cualquier idea o pendiente en un campo de texto, y la IA clasifica y desglosa esas ideas en tareas concretas, cada una con título, categoría (como Universidad, Programación, Cocinar, etc.), prioridad (alta, media, baja), esfuerzo estimado y notas relevantes. Las tareas pueden tener subtareas, información adicional (notas, enlaces, documentos) y se gestionan en diferentes vistas: lista, detalle y tablero Kanban, permitiendo cambiar el estado (por hacer, en progreso, completada) y organizar por categorías.

La interfaz es intuitiva, visualmente atractiva y responsiva, utilizando componentes personalizados y estilos modernos. El sistema incluye manejo robusto de errores, permitiendo que el usuario nunca pierda información aunque la IA falle. Además, la arquitectura está preparada para expandirse, permitiendo agregar nuevas categorías, tipos de información y funcionalidades de productividad.

En resumen, es una app que transforma el caos mental en productividad organizada, combinando lo mejor de la inteligencia artificial y el diseño de experiencia de usuario para ayudar a cualquier persona a gestionar sus tareas y proyectos personales o profesionales.
