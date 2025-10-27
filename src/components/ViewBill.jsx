import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./ViewBill.css";

function ViewBill() {
  const location = useLocation();
  const { state } = location;

  // Razorpay or API Data
  const razorpayData = state?.billData || {
    payment_id: "pay_1234567890",
    amount: 2900,
    currency: "INR",
    status: "captured",
    created_at: 1696118400,
    method: "upi",
    email: "john@gmail.com",
    contact: "1234567890",
    description: "Payment for 3 Months Plan",
  };

  // Convert amount from paisa to rupees
  const amountInRupees = (razorpayData.amount / 100).toFixed(2);

  // Convert Unix timestamp to readable date
  const paymentDate = new Date(razorpayData.created_at * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Generate PDF
  const downloadPDF = async () => {
    const element = document.getElementById("invoice-container");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Evnazon_Bill_${razorpayData.payment_id}.pdf`);
  };

  return (
    <div className="view-bill-page">
      <div id="invoice-container" className="invoice-box">
        <div className="invoice-header">
          <div className="company-info">
            <h2>Evnzon Pvt. Ltd</h2>
            <p>www.evnzon.in</p>
            <p>support@evnzon.in</p>
            <p>+91 9876543210</p>
          </div>
          <div className="invoice-info">
            <h3>INVOICE</h3>
            <p><b>Invoice ID:</b> {razorpayData.payment_id}</p>
            <p><b>Date:</b> {paymentDate}</p>
          </div>
        </div>

        <hr />

        <div className="bill-section">
          <div className="bill-row">
            <span><b>Customer Name</b></span>
            <span>{razorpayData.email.split("@")[0].toUpperCase()}</span>
          </div>
          <div className="bill-row">
            <span><b>Contact</b></span>
            <span>{razorpayData.contact}</span>
          </div>
          <div className="bill-row">
            <span><b>Email</b></span>
            <span>{razorpayData.email}</span>
          </div>
          <div className="bill-row">
            <span><b>Payment Method</b></span>
            <span>{razorpayData.method.toUpperCase()}</span>
          </div>
          <div className="bill-row">
            <span><b>Payment Status</b></span>
            <span
              className={`status-tag ${
                razorpayData.status.toLowerCase() === "paid" ||
                razorpayData.status.toLowerCase() === "captured"
                  ? "paid"
                  : "unpaid"
              }`}
            >
              {razorpayData.status.toUpperCase()}
            </span>
          </div>
          <div className="bill-row">
            <span><b>Description</b></span>
            <span>{razorpayData.description}</span>
          </div>
          <div className="bill-row total-row">
            <span><b>Total Amount</b></span>
            <span>
              {razorpayData.currency} {amountInRupees}
            </span>
          </div>
        </div>

        <div className="footer">
          <p>Thank you for choosing Evnzon!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>

      <div className="view-bill-actions">
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
        <button className="download-btn" onClick={downloadPDF}>
          ⬇ Download PDF
        </button>
      </div>
    </div>
  );
}

export default ViewBill;

// import { useLocation } from 'react-router-dom';
// import './ViewBill.css';

// function ViewBill() {
//   const location = useLocation();
//   const { state } = location;

//   // Simulated Razorpay payment data (replace with actual backend data)
//   const razorpayData = state?.billData || {
//     payment_id: 'pay_1234567890',
//     amount: 2900, // Razorpay amount is in paisa (e.g., 2900 paisa = 29.00 INR)
//     currency: 'INR',
//     status: 'captured', // Possible values: created, authorized, captured, refunded, failed
//     created_at: 1696118400, // Unix timestamp
//     method: 'upi', // e.g., card, netbanking, wallet, upi
//     email: 'john@gmail.com',
//     contact: '1234567890',
//     description: 'Payment for 3 Months Plan',
//   };

//   // Convert Razorpay amount (in paisa) to INR
//   const amountInRupees = (razorpayData.amount / 100).toFixed(2);

//   // Convert Unix timestamp to readable date
//   const paymentDate = new Date(razorpayData.created_at * 1000).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });

//   return (
//     <div className="view-bill-container">
//       <div className="view-bill-header">
//         <h2>Evnazon - Bill Details (Razorpay)</h2>
//         <button className="close-button" onClick={() => window.history.back()}>×</button>
//       </div>
//       <div className="bill-details">
//         <div className="detail-row">
//           <span>Payment ID</span>
//           <span>{razorpayData.payment_id}</span>
//         </div>
//         <div className="detail-row">
//           <span>Amount</span>
//           <span>{razorpayData.currency} {amountInRupees}</span>
//         </div>
//         <div className="detail-row">
//           <span>Status</span>
//           <span>{razorpayData.status.charAt(0).toUpperCase() + razorpayData.status.slice(1)}</span>
//         </div>
//         <div className="detail-row">
//           <span>Date</span>
//           <span>{paymentDate}</span>
//         </div>
//         <div className="detail-row">
//           <span>Payment Method</span>
//           <span>{razorpayData.method.charAt(0).toUpperCase() + razorpayData.method.slice(1)}</span>
//         </div>
//         <div className="detail-row">
//           <span>Email</span>
//           <span>{razorpayData.email}</span>
//         </div>
//         <div className="detail-row">
//           <span>Contact</span>
//           <span>{razorpayData.contact}</span>
//         </div>
//         <div className="detail-row">
//           <span>Description</span>
//           <span>{razorpayData.description}</span>
//         </div>
//       </div>
//       <button className="download-button" onClick={() => alert('Download PDF initiated!')}>
//         Download PDF
//       </button>
//     </div>
//   );
// }

// export default ViewBill;