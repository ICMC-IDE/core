class Panel extends EventTarget {
  #children: string[] = [];

  open(uri: string, order?: number): () => void {
    if (order !== undefined) {
      this.#children.splice(order, 0, uri);
    } else {
      this.#children.push(uri);
    }

    this.dispatchEvent(new CustomEvent("change"));

    return () => {
      const index = this.#children.indexOf(uri);

      if (index !== -1) {
        this.#children.splice(index, 1);
        this.dispatchEvent(new CustomEvent("change"));
      }
    };
  }

  render(): DocumentFragment {
    const fragment = new DocumentFragment();

    for (let i = 0; i < this.#children.length; i++) {
      const view = document.createElement("x-view");
      view.setAttribute("uri", this.#children[i]);
      fragment.appendChild(view);
    }

    return fragment;
  }
}

export const PrimarySidebar = new Panel();
export const SecondarySidebar = new Panel();
export const ActivityBar = new Panel();
export const StatusBar = new Panel();
