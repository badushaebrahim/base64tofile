const form = document.getElementById('convert-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const format = formData.get('format');
  const data = formData.get('data');

  const response = await fetch('/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data, format })
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    alert(`Conversion failed: ${errorMessage}`);
    return;
  }

  const blob = await response.blob();

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `file.${format}`;
  link.click();
});
