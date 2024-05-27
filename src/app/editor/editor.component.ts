import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent {
  title: string = '';
  content: string = '';
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;
  @ViewChild('insertImageButton', { static: false }) insertImageButton: ElementRef | undefined;
  draggedElement: HTMLElement | null = null;
  originalParent: Node | null = null;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    document.addEventListener('keydown', this.handleBackspace.bind(this));
  }

  onContentChange(event: any) {
    this.content = event.target.innerHTML;
  }

  publish() {
    const article = {
      title: this.title,
      content: this.content,
    };
    console.log(article);
    // Navigate to /article/preview to display the article (implement this in routing)
  }

  triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.draggable = true;
        img.style.maxWidth = '100%';
        img.setAttribute('contenteditable', 'false');
        img.addEventListener('dragstart', this.onDragStart.bind(this));
        img.addEventListener('dragover', this.onDragOver.bind(this));
        img.addEventListener('drop', this.onDrop.bind(this));
        img.addEventListener('dragend', this.onDragEnd.bind(this));

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          const contentElement = document.querySelector('.content');
          if (contentElement) {
            this.onContentChange({ target: { innerHTML: contentElement.innerHTML } });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onDragStart(event: DragEvent) {
    this.draggedElement = event.target as HTMLElement;
    this.originalParent = this.draggedElement.parentNode;
    event.dataTransfer?.setData('text/plain', '');
    (event.target as HTMLElement).style.opacity = '0.4';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.draggedElement) {
      this.draggedElement.style.opacity = '1';
      const content = document.querySelector('.content');
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (range && content) {
        range.insertNode(this.draggedElement);
        if (this.originalParent) {
          this.originalParent.removeChild(this.draggedElement);
        }
        this.draggedElement = null;
        const contentElement = document.querySelector('.content');
        if (contentElement) {
          this.onContentChange({ target: { innerHTML: contentElement.innerHTML } });
        }
      }
    }
  }

  onDragEnd(event: DragEvent) {
    if (this.draggedElement && this.originalParent) {
      this.originalParent.removeChild(this.draggedElement);
      this.draggedElement = null;
      this.originalParent = null;
    }
  }

  handleBackspace(event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer as HTMLElement;
        const previousSibling = startContainer.previousSibling as HTMLElement;

        if (previousSibling && previousSibling.tagName === 'IMG') {
          event.preventDefault();
          previousSibling.remove();
          const contentElement = document.querySelector('.content');
          if (contentElement) {
            this.onContentChange({ target: { innerHTML: contentElement.innerHTML } });
          }
        }
      }
    }
  }

  updateInsertButtonPosition(event: MouseEvent | KeyboardEvent) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).getBoundingClientRect();
      const button = this.insertImageButton?.nativeElement;

      if (button) {
        button.style.display = 'block';
        button.style.top = `${range.top + window.scrollY}px`;
        button.style.left = `${range.right + 5 + window.scrollX}px`;
      }
    } else if (this.insertImageButton) {
      const button = this.insertImageButton.nativeElement;
      button.style.display = 'block';
      const contentElement = document.querySelector('.content');
      if (contentElement) {
        const rect = contentElement.getBoundingClientRect();
        button.style.top = `${rect.top + window.scrollY}px`;
        button.style.left = `${rect.left + 5 + window.scrollX}px`;
      }
    }
  }
}
