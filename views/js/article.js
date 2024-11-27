document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentText = document.getElementById('comment-text').value;
        if (commentText.trim() !== '') {
            addComment(commentText);
            commentForm.reset();
        }
    });

    function addComment(text) {
        const comment = document.createElement('div');
        comment.className = 'comment';
        comment.innerHTML = `
            <div class="comment-author">Anonymous User</div>
            <div class="comment-date">${new Date().toLocaleString()}</div>
            <p>${text}</p>
        `;
        commentsList.prepend(comment);
    }

    // Simulate loading existing comments
    const sampleComments = [
        { author: 'John Doe', date: '2024-05-14 10:30:00', text: 'Great article! I learned a lot about e-waste recycling.' },
        { author: 'Jane Smith', date: '2024-05-14 11:15:00', text: 'I\'ve been looking for ways to recycle my old electronics. This was very helpful.' },
        { author: 'Mike Johnson', date: '2024-05-14 12:00:00', text: 'We need more awareness about this issue. Thanks for sharing!' }
    ];

    sampleComments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-date">${comment.date}</div>
            <p>${comment.text}</p>
        `;
        commentsList.appendChild(commentElement);
    });

    // Share buttons functionality
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.classList[1];
            const articleUrl = encodeURIComponent(window.location.href);
            const articleTitle = encodeURIComponent(document.title);
            let shareUrl;

            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${articleUrl}&text=${articleTitle}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${articleUrl}&title=${articleTitle}`;
                    break;
            }

            window.open(shareUrl, '_blank', 'width=600,height=400');
        });
    });
});

document.getElementById('goBackButton').addEventListener('click', function() {
    window.history.back();
});