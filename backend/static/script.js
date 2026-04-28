let dropArea = document.getElementById("drop-area");
let fileInput = document.getElementById("fileElem");

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.border = "2px dashed red";
});

dropArea.addEventListener("dragleave", () => {
    dropArea.style.border = "2px dashed #444";
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.border = "2px dashed #444";

    let files = e.dataTransfer.files;
    fileInput.files = files;
});