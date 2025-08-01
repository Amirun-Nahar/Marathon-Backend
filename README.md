# Runlytic Marathon / Marathon Management System

This project is a full-stack web application designed to streamline the management of marathon events, participant registrations, and results. It provides a user-friendly interface for event organizers and participants to interact with event data.

<!-- Project Overview -->
<p align="center">
   <a href="https://ibb.co/PzVg2X8j"><img src="https://i.ibb.co/FqdzQZt3/Homepage.png" alt="Homepage" border="0"></a>
   <a href="https://ibb.co/d0r2xMN9"><img src="https://i.ibb.co/TBk8d2QX/Data.png" alt="Data" border="0"></a>
   <a href="https://ibb.co/KjMpr2Bn"><img src="https://i.ibb.co/7Jwd1nBh/Upcoming-Events.png" alt="Upcoming-Events" border="0"></a>
  
</p>

## Technologies Used

<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
</p>

## Features

* **Event Listing:** Browse and view details of upcoming and past marathon events.
* **Participant Registration:** Users can register for events, providing necessary details.
* **User Authentication:** Secure signup and login for participants and organizers.
* **Admin Dashboard:** Manage events, view registrations, and publish results.
* **Responsive Design:** Optimized for seamless experience across various devices.
* **RESTful API:** Robust backend handling data operations.

## Dependencies

This project relies on a few key dependencies for both frontend and backend operations.

**Frontend (React):**
* `react`: Core React library
* `react-router-dom`: For client-side routing
* `axios`: For making HTTP requests to the backend
* `tailwindcss` or `bootstrap` (or similar for styling)


**Backend (Node.js/Express.js):**
* `express`: Web framework for Node.js
* `mongoose`: MongoDB object modeling for Node.js
* `cors`: For enabling Cross-Origin Resource Sharing
* `dotenv`: For loading environment variables
* `bcryptjs`: For password hashing
* `jsonwebtoken`: For authentication (JWTs)


## How to Run Locally

To get a local copy of this project up and running, follow these simple steps:

### Prerequisites

Make sure you have the following installed:
* Node.js (LTS version recommended)
* npm (Node Package Manager) or Yarn
* MongoDB (running locally or a cloud instance like MongoDB Atlas)
* Git

### Backend Setup

1.  **Clone the backend repository:**
    ```bash
    https://github.com/Amirun-Nahar/Marathon-Backend.git
    ```
2.  **Navigate into the backend directory:**
    ```bash
    cd Marathon-Backend
    ```
3.  **Install backend dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

4.  **Start the backend server:**
    ```bash
    npm start
    # or node server.js (if your main file is named server.js)
    ```
    The backend should be running on `http://localhost:5000` (or your specified port).

### Frontend Setup

1.  **Clone the frontend repository:**
    ```bash
    https://github.com/Amirun-Nahar/Marathon-Backend
    ```
   
2.  **Navigate into the frontend directory:**
    ```bash
    cd Marathon-Frontend
    # or cd client 
    ```
3.  **Install frontend dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
4.  **Create a `.env` file in the `Marathon-Frontend` directory** (if applicable for API URLs). Example:
    ```
    REACT_APP_API_URL=http://localhost:5000/api
    ```
5.  **Start the frontend application:**
    ```bash
    npm start
    # or yarn start
    ```
    The frontend application should open in your browser, typically at `http://localhost:3000`.

## Links

* **Live Demo:** [https://runlytic-marathon.netlify.app/]
* **Frontend Repository:** [https://github.com/Amirun-Nahar/Marathon-Backend/tree/main]*
* **Backend Repository:** [https://github.com/Amirun-Nahar/Marathon-Backend]*
