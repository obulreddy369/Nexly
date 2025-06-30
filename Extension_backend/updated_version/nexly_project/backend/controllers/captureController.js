const saveData = async (req, res) => {
  try {
    const email = req.body.email || '';
    console.log('Received email:', email);
    const selectedText = req.body.selectedText || '';
    const rawFileName = req.body.fileName || `capture-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const title = rawFileName.replace(/\.txt$/, '');

    const formData = {
      title,
      url: '',
      description: selectedText,
      tags: '',
      category: '',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    const structuredData = {
      email,
      title: formData.title,
      link: formData.url,
      description: formData.description,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      category: formData.category,
      date: formData.dateAdded,
    };

    console.log('Structured Data:', structuredData);

    res.status(200).json({ status: 'success', data: structuredData });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { saveData };