import * as React from "react";
import { Button, InputAdornment, OutlinedInput } from "@mui/material";
import { MagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import debounce from "lodash/debounce";

interface UserFiltersProps {
	onSearch: (searchTerm: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({ onSearch }) => {
	const [value, setValue] = React.useState("");

	const handleSearch = React.useCallback(() => {
		onSearch(value);
	}, [onSearch, value]);

	const debouncedFetchResults = React.useMemo(() => debounce(handleSearch, 500), [handleSearch]);

	React.useEffect(() => {
		if (value) {
			debouncedFetchResults();
		}
		// Cleanup the debounce effect when the component unmounts
		return () => {
			debouncedFetchResults.cancel();
		};
	}, [value, debouncedFetchResults, handleSearch]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setValue(value);
		if (value.length == 0) {
			onSearch("");
		}
	};

	return (
		<OutlinedInput
			value={value}
			fullWidth
			placeholder="Search Users"
			startAdornment={
				<InputAdornment position="start">
					<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
				</InputAdornment>
			}
			onChange={handleChange}
			sx={{ maxWidth: "500px" }}
		/>
	);
};

export default UserFilters;
