document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photos');
    const photoPreview = document.getElementById('photoPreview');
    const listingForm = document.getElementById('listingForm');

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Handle click to upload
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Handle file uploads
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'preview-wrapper';
                    wrapper.appendChild(img);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-photo';
                    removeBtn.innerHTML = '×';
                    removeBtn.onclick = () => wrapper.remove();
                    
                    wrapper.appendChild(removeBtn);
                    photoPreview.appendChild(wrapper);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle form submission
    listingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(listingForm);
        
        // Add photos to form data
        const photos = photoPreview.querySelectorAll('img');
        photos.forEach((photo, index) => {
            formData.append(`photo${index}`, photo.src);
        });

        // Here you would typically send the data to your server
        console.log('Form submitted:', Object.fromEntries(formData));
        
        // Show success message
        showNotification('Item listed successfully!');
        
        // Reset form
        listingForm.reset();
        photoPreview.innerHTML = '';
    });

    // Handle draft saving
    const draftBtn = document.querySelector('.draft-btn');
    draftBtn.addEventListener('click', () => {
        const formData = new FormData(listingForm);
        localStorage.setItem('listingDraft', JSON.stringify(Object.fromEntries(formData)));
        showNotification('Draft saved successfully!');
    });

    // Load draft if exists
    const savedDraft = localStorage.getItem('listingDraft');
    if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        Object.entries(draft).forEach(([key, value]) => {
            const input = listingForm.elements[key];
            if (input) {
                input.value = value;
            }
        });
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}); 