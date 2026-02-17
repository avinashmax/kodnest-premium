function toggleProof(element) {
    element.classList.toggle('checked');
    checkCompletion();
}

function copyPrompt() {
    const promptText = document.querySelector('.prompt-box').innerText;
    navigator.clipboard.writeText(promptText).then(() => {
        const btn = document.querySelector('button[onclick="copyPrompt()"]');
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        setTimeout(() => {
            btn.innerText = originalText;
        }, 2000);
    });
}

function checkCompletion() {
    const items = document.querySelectorAll('.proof-item');
    const allChecked = Array.from(items).every(item => item.classList.contains('checked'));
    
    if (allChecked) {
        const statusBadge = document.querySelector('.status-badge');
        statusBadge.innerText = "Shipped";
        statusBadge.style.backgroundColor = "var(--color-success)";
        statusBadge.style.color = "white";
    }
}
