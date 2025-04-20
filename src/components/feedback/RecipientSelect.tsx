
import { User } from "@/types/userTypes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecipientSelectProps {
  recipients: User[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const RecipientSelect = ({
  recipients,
  value,
  onChange,
  disabled
}: RecipientSelectProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="recipient">
        Recipient
      </label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="recipient">
          <SelectValue placeholder="Select a recipient" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Recipients</SelectLabel>
            {recipients.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.username}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
