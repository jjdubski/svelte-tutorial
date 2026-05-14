import { SvelteSet } from 'svelte/reactivity';

export function initSelection() {
	return { lastClickedId: null };
}

export function handleSelectionClick(e, todo, store, selectionKey, lastClickedState) {
	const selectSet = store[selectionKey];
	const allTodos = selectionKey === 'selectedTodos' ? store.todos : store.archivedTodos;

	if (e.ctrlKey || e.metaKey) {
		if (selectSet.has(todo.id)) {
			selectSet.delete(todo.id);
		} else {
			selectSet.add(todo.id);
		}
		store[selectionKey] = new SvelteSet(selectSet);
		lastClickedState.lastClickedId = todo.id;
	} else if (e.shiftKey && lastClickedState.lastClickedId !== null) {
		const lastIdx = allTodos.findIndex((t) => t.id === lastClickedState.lastClickedId);
		const currentIdx = allTodos.findIndex((t) => t.id === todo.id);
		if (lastIdx !== -1 && currentIdx !== -1) {
			const start = Math.min(lastIdx, currentIdx);
			const end = Math.max(lastIdx, currentIdx);
			for (let i = start; i <= end; i++) {
				selectSet.add(allTodos[i].id);
			}
			store[selectionKey] = new SvelteSet(selectSet);
		}
	} else {
		store[selectionKey] = new SvelteSet([todo.id]);
		lastClickedState.lastClickedId = todo.id;
	}
}

export function clearSelection(store, selectionKey, lastClickedState) {
	store[selectionKey] = new SvelteSet();
	if (lastClickedState) lastClickedState.lastClickedId = null;
}
