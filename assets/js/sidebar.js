/**
 * Sidebar Engine for AI Coding Academy
 * Group lessons by Tier and render nested accordion
 */
async function initSidebar() {
    const sidebarContainer = document.getElementById('ce-sidebar-nav');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('../assets/data/MasterLibrary.json');
        const data = await response.json();
        const tracks = data.tracks;

        // 1. Build HTML from tracks array
        let html = '';
        tracks.forEach(track => {
            const label = `Level ${track.tier}: ${track.title}`;
            const lessons = track.lessons || [];
            html += `
                <div class="sidebar-tier">
                    <button class="tier-trigger" onclick="this.parentElement.classList.toggle('active')">
                        <span class="tier-icon">▹</span>
                        <span class="tier-title">${label}</span>
                        <span class="tier-count">${lessons.length}</span>
                    </button>
                    <div class="tier-content">
                        ${lessons.map(l => `
                            <a href="/learn/lesson.html?id=${l.id}&type=lesson" class="sidebar-item ${window.location.search.includes(l.id) ? 'active' : ''}">
                                <span class="item-id">${l.id.split('-')[0]}</span>
                                <span class="item-title">${l.title}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        sidebarContainer.innerHTML = html;

    } catch (err) {
        console.error("Sidebar Load Error:", err);
    }
}

document.addEventListener('DOMContentLoaded', initSidebar);