window.SwaggerDocsManager = (() => {
    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>API Documentation</h2>
                <p>Interact with the REST API directly using Swagger UI.</p>
            </div>
        </div>
        <div style="background: white; border-radius: 8px; overflow: hidden; height: 75vh; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <iframe src="http://localhost:5100/swagger" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
    `;

    const init = () => {
        const container = document.getElementById('panel-swaggerdocs');
        if (container) {
            container.innerHTML = renderPanelHTML();
        }
    };

    return { init };
})();
