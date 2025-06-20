import React, { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { database } from "./firebase";
import Swal from "sweetalert2";
import "./App.css";

function App() {
  const [tab, setTab] = useState("student");
  const [studentID, setStudentID] = useState("");
  const [bookID, setBookID] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const checkStudent = async () => {
    if (!studentID) {
      Swal.fire("Input Missing", "Please enter a Student ID", "warning");
      return;
    }
    setMessage("Searching student...");
    const studentRef = ref(database, `students/${studentID}`);
    const snapshot = await get(studentRef);
    if (snapshot.exists()) {
      const student = snapshot.val();
      setStudentData(student);
      setMessage("✅ Student found");

      Swal.fire("Student Found", `Name: ${student.name}`, "success");

      if (student.borrowedBookID) {
        const bookRef = ref(database, `books/${student.borrowedBookID}`);
        const bookSnap = await get(bookRef);
        if (bookSnap.exists()) {
          setBookData(bookSnap.val());
        } else {
          setBookData(null);
        }
      } else {
        setBookData(null);
      }
    } else {
      setStudentData(null);
      setBookData(null);
      Swal.fire("Not Found", "❌ Student not found. Please retry.", "error");
    }
  };

  const checkBook = async () => {
    if (!bookID) {
      Swal.fire("Input Missing", "Please enter a Book ID", "warning");
      return;
    }
    setMessage("Searching book...");
    const bookRef = ref(database, `books/${bookID}`);
    const snapshot = await get(bookRef);
    if (snapshot.exists()) {
      const book = snapshot.val();
      setBookData(book);
      setMessage("✅ Book found");
      Swal.fire("Book Found", `Title: ${book.title}`, "success");
    } else {
      setBookData(null);
      Swal.fire("Not Found", "❌ Book not found. Please retry.", "error");
    }
  };

  const resetScan = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will reset the form.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setStudentID("");
        setBookID("");
        setStudentData(null);
        setBookData(null);
        setMessage("🔄 Scan reset. Ready for new scan.");
        Swal.fire("Reset!", "Scan has been reset.", "success");
      }
    });
  };

  return (
    <div className="library-app">
      {/* Dark Mode Toggle */}
      <label className="theme-toggle">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
        🌙 Toggle Dark Mode
      </label>

      <h2>Library Management System</h2>

      <div className="tab-buttons">
        <button
          onClick={() => setTab("student")}
          className={tab === "student" ? "active" : ""}
        >
          Student Info
        </button>
        <button
          onClick={() => setTab("book")}
          className={tab === "book" ? "active" : ""}
        >
          Book Availability
        </button>
      </div>

      {tab === "student" && (
        <div className="input-group">
          <label>Student ID:</label>
          <input
            type="text"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)}
            placeholder="Enter student ID"
          />
          <button onClick={checkStudent}>Check Student</button>

          {studentData && (
            <div className="data-display">
              <strong>Name:</strong> {studentData.name} <br />
              <strong>Phone:</strong> {studentData.phone} <br />
              <strong>ID:</strong> {studentID} <br />
              {studentData.borrowedBookID ? (
                <>
                  <strong>Borrowed Book ID:</strong>{" "}
                  {studentData.borrowedBookID} <br />
                  {bookData ? (
                    <>
                      <strong>Book Title:</strong> {bookData.title} <br />
                      <strong>Available:</strong>{" "}
                      {bookData.available ? "Yes" : "No"}
                    </>
                  ) : (
                    <em>Loading book info...</em>
                  )}
                </>
              ) : (
                <em>No book currently borrowed</em>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "book" && (
        <div className="input-group">
          <label>Book ID:</label>
          <input
            type="text"
            value={bookID}
            onChange={(e) => setBookID(e.target.value)}
            placeholder="Enter book ID"
          />
          <button onClick={checkBook}>Check Book</button>

          {bookData && (
            <div className="data-display">
              <strong>Title:</strong> {bookData.title} <br />
              <strong>ID:</strong> {bookID} <br />
              <strong>Available:</strong>{" "}
              {bookData.available ? "Yes" : "No"}
            </div>
          )}
        </div>
      )}

      <button className="reset-btn" onClick={resetScan}>
        Reset Scan
      </button>

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;
