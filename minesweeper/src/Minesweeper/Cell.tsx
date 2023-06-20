import { Devvit } from "@devvit/public-api-next";
import { CellState } from "./game.js";

export interface CellProps {
  row: number;
  col: number;
  state: CellState;
  adjacentMines: number;
  isMine: boolean;
  onClick: ({ row, col }: { row: number; col: number }) => void;
}

export const Cell = (props: CellProps) => {
  const { state, adjacentMines, isMine } = props;

  return (
    <vstack
      border="thin"
      gap="none"
      padding="medium"
      backgroundColor={getCellColor()}
      onPress={() => props.onClick({ row: props.row, col: props.col })}
    >
      <text color={getCellTextColor()}>{getCellText()}</text>
    </vstack>
  );

  function getCellTextColor() {
    if (state !== CellState.Revealed) {
      // return a color that is the same as the background color
      return getCellColor();
    }

    if (isMine) {
      return "#FF0000";
    }

    switch (adjacentMines) {
      case 0:
        return getCellColor();
      case 1:
        return "#0000FF";
      case 2:
        return "#008000";
      case 3:
        return "#FF0000";
      case 4:
        return "#000080";
      default:
        throw new Error("wtf, unexpected adjacentMines value");
    }
  }

  function getCellText() {
    if (state !== CellState.Revealed) {
      return "?";
    }

    if (isMine) {
      return "B";
    }

    if (adjacentMines === 0) {
      return "0";
    }

    return adjacentMines.toString();
  }

  function getCellColor() {
    if (state === CellState.Revealed) {
      return isMine ? "#FF0000" : "#BFADA9";
    }
    if (state === CellState.Flagged) {
      return "#ECDC91";
    }
    // hidden
    return "#D8C5C0";
  }
};
