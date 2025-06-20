import { useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "./firebase";
import emailjs from "@emailjs/browser";

const BorrowMonitor = () => {
  useEffect(() => {
    const studentRef = ref(database, "students");

    const unsubscribe = onValue(studentRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(([studentID, student]) => {
        if (
          student.borrowedBookID &&
          student.email &&
          !student.emailSent
        ) {
          // Send email
          emailjs
            .send(
              "your_service_id",     // Replace with EmailJS service ID
              "your_template_id",    // Replace with template ID
              {
                to_email: student.email,
                to_name: student.name,
                book_id: student.borrowedBookID,
              },
              "your_public_key"      // Replace with public key
            )
            .then(() => {
              console.log(`✅ Email sent to ${student.email}`);

              // Update emailSent flag in Firebase
              update(ref(database, `students/${studentID}`), {
                emailSent: true,
              });
            })
            .catch((err) => console.error("❌ Email send failed:", err));
        }
      });
    });

    return () => unsubscribe(); // cleanup
  }, []);

  return null; // No UI
};

export default BorrowMonitor;
