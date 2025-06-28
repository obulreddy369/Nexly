import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';

// Helper: Convert image URL to base64 for jsPDF
const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const ResourcePreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resource = location.state?.resource;

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300 bg-white dark:bg-black">
        Resource not found.
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    doc.setFontSize(18);
    doc.text(resource.title || 'Untitled', 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Category: ${resource.category}`, 10, y);
    y += 10;

    doc.text(`Date Added: ${new Date(resource.dateAdded).toLocaleDateString()}`, 10, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Description:", 10, y);
    y += 8;

    doc.setFontSize(12);
    const description = resource.description || '';
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts = description.split(imageRegex); // text, alt, url, text, alt, url...

    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // text content
        const lines = doc.splitTextToSize(parts[i], 180);
        lines.forEach(line => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 10, y);
          y += 7;
        });
      } else if (i % 3 === 2) {
        // image URL part
        const imageUrl = parts[i];
        try {
          const imgData = await getImageBase64(imageUrl);
          const imgProps = doc.getImageProperties(imgData);
          const imgWidth = 160;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

          if (y + imgHeight > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }

          doc.addImage(imgData, 'JPEG', 10, y, imgWidth, imgHeight);
          y += imgHeight + 10;
        } catch (err) {
          console.warn('Failed to load image:', imageUrl);
        }
      }
    }

    doc.save(`${resource.title || 'resource'}.pdf`);
  };

  // Escape HTML special characters to preserve < > and code
  const escapeHtml = (unsafe = '') =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const renderDescriptionWithImages = (description = '') => {
    // First escape HTML, then replace image markdown with <img>
    // But for images, we want to keep the <img> tag unescaped
    // So, split and process
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let result = '';
    let match;
    while ((match = imageRegex.exec(description)) !== null) {
      // Add text before image, escaped
      result += escapeHtml(description.slice(lastIndex, match.index));
      // Add image tag (not escaped)
      result += `<img src="${match[2]}" alt="${escapeHtml(match[1])}" style="max-width: 1000px; max-height: 500px; margin: 10px 0; border-radius: 12px;" />`;
      lastIndex = imageRegex.lastIndex;
    }
    // Add remaining text
    result += escapeHtml(description.slice(lastIndex));
    return result;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-white to-[#e0e7ff] dark:from-gray-900 dark:to-black text-gray-900 dark:text-white px-6 py-14 md:px-20"
    >
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-6 cursor-pointer hover:underline"
        >
          <ArrowLeft size={20} />
          <span className="text-md font-medium">Back to Resources</span>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 space-y-8 border border-gray-200 dark:border-gray-700"
        >
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 dark:text-indigo-300">
            {resource.title}
          </h1>

          {/* Description with images */}
          <div
            className="bg-gray-100 dark:bg-gray-800 text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: renderDescriptionWithImages(resource.description) }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {resource.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm bg-indigo-100 dark:bg-indigo-600 text-indigo-800 dark:text-white px-4 py-1 rounded-full shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-4 space-y-1 text-sm">
            <p>
              <strong className="text-gray-700 dark:text-gray-400">Category:</strong> {resource.category}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-400">Date Added:</strong>{' '}
              {new Date(resource.dateAdded).toLocaleDateString()}
            </p>
          </div>

          {/* Download Button */}
          <div className="pt-6 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={handleDownloadPDF}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition duration-300 shadow-lg"
            >
              Download as PDF
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResourcePreviewPage;