import {Component, ViewChild, ElementRef, Renderer2, OnInit} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { RouterModule } from '@angular/router';
import {NgClass, NgIf, NgStyle} from "@angular/common";

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    NgClass,
    NgStyle,
    NgIf
  ],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit{
  title: string = '';
  content: string = '';
  showModal: boolean = false;
  showResizeMenu1: boolean = false;
  resizeMenuStyle = {};
  selectedImage: HTMLElement | null = null;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;
  @ViewChild('insertImageButton', { static: false }) insertImageButton: ElementRef | undefined;
  draggedElement: HTMLElement | null = null;
  originalParent: Node | null = null;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    document.addEventListener('keydown', this.handleBackspace.bind(this));
    document.addEventListener('click', this.handleClickOutside.bind(this));
    const contentElement = document.querySelector('.content');
    if (contentElement) {
      // @ts-ignore
      contentElement.addEventListener('dragover', this.onDragOver.bind(this));
      // @ts-ignore
      contentElement.addEventListener('drop', this.onDrop.bind(this));
    }
  }

  onContentChange(event: any) {
    this.content = event.target.innerHTML;
    this.updateInsertButtonPosition(event);
  }

  publish() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';
        imgContainer.draggable = true;
        imgContainer.addEventListener('dragstart', this.onDragStart.bind(this));
        imgContainer.addEventListener('dragover', this.onDragOver.bind(this));
        imgContainer.addEventListener('drop', this.onDrop.bind(this));
        imgContainer.addEventListener('dragend', this.onDragEnd.bind(this));

        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.setAttribute('contenteditable', 'false');
        img.addEventListener('click', this.showResizeMenu.bind(this));

        const caption = document.createElement('div');
        caption.contentEditable = 'true';
        caption.className = 'image-caption';
        caption.innerText = 'Add a caption';

        imgContainer.appendChild(img);
        imgContainer.appendChild(caption);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(imgContainer);
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

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragStart(event: DragEvent) {
    const target = (event.target as HTMLElement).closest('.image-container');
    if (target) {
      this.draggedElement = target as HTMLElement;
      this.originalParent = this.draggedElement.parentNode;
      event.dataTransfer?.setData('text/html', this.draggedElement.outerHTML);
      setTimeout(() => {
        // @ts-ignore
        this.draggedElement.style.display = 'none';
      }, 100);
    }
  }

  onDrop(event: DragEvent) {

    if (this.draggedElement) {
      this.draggedElement.style.display = 'block';
      const content = document.querySelector('.content');
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (range && content) {
        range.deleteContents(); // Ensure the original content at the drop point is cleared
        range.insertNode(this.draggedElement);
        this.draggedElement = null;
        const contentElement = document.querySelector('.content');
        if (contentElement) {
          this.onContentChange({ target: { innerHTML: contentElement.innerHTML } });
        }
      }
    }
  }

  onDragEnd(event: DragEvent) {
    if (this.draggedElement) {
      this.draggedElement.style.display = 'block';
      this.draggedElement = null;
      // @ts-ignore
      this.originalParent.style.display = 'none';
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
    const contentElement = document.querySelector('.content');

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).getBoundingClientRect();
      const button = this.insertImageButton?.nativeElement;

      if (button) {
        button.style.display = 'block';
        button.style.top = `${range.top + window.scrollY}px`;
        button.style.left = `${range.right + 5 + window.scrollX}px`;
      }
    } else if (contentElement && this.insertImageButton) {
      const button = this.insertImageButton.nativeElement;
      button.style.display = 'block';
      const rect = contentElement.getBoundingClientRect();
      button.style.top = `${rect.top + window.scrollY + 5}px`;
      button.style.left = `${rect.left + rect.width / 2 - button.offsetWidth / 2 + window.scrollX}px`;
    }
  }

  showResizeMenu(event: MouseEvent) {
    event.stopPropagation();
    const img = event.target as HTMLElement;
    const rect = img.getBoundingClientRect();
    this.resizeMenuStyle = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`
    };
    this.selectedImage = img;
    this.showResizeMenu1 = true;
  }

  resizeImage(size: string) {
    if (this.selectedImage) {
      (this.selectedImage as HTMLElement).style.width = size;
      this.closeResizeMenu();
    }
  }

  closeResizeMenu() {
    this.showResizeMenu1 = false;
    this.selectedImage = null;
  }

  handleClickOutside(event: MouseEvent) {
    if (this.showResizeMenu1 && !document.getElementById('resizeMenu')?.contains(event.target as Node)) {
      this.closeResizeMenu();
    }
  }
}
