import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { RuleEditingState } from './types.js';

const initialState: RuleEditingState = {
  editingRuleId: null,
};

export const editingSlice: Slice<RuleEditingState> = createSlice({
  name: 'ruleEditing',
  initialState,
  reducers: {
    startEditingRule: (state, action: PayloadAction<string>) => {
      state.editingRuleId = action.payload;
    },
    stopEditingRule: (state) => {
      state.editingRuleId = null;
    },
  },
});

export const { startEditingRule, stopEditingRule } = editingSlice.actions;

export default editingSlice.reducer;
