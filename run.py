import tkinter as tk
from tkinter import filedialog, messagebox
import csv
import hashlib
import os

def clean_aadhaar_number(aadhaar_num):
    """
    Remove any spaces in the Aadhaar number to ensure consistent hashing.
    """
    return aadhaar_num.replace(" ", "").strip()

def check_all_hashes_present(input_csv, comparison_csv):
    """
    Hashes Aadhaar numbers from 'input_csv', compares them with hashed Aadhaar numbers in 'comparison_csv',
    and returns True if all hashed Aadhaar numbers from 'input_csv' are present in 'comparison_csv', else False.
    """
    try:
        # Read hashed Aadhaar numbers from the comparison file into a set for fast lookup
        with open(comparison_csv, 'r', newline='', encoding='utf-8') as comp_file:
            comp_reader = csv.reader(comp_file)
            comp_header = next(comp_reader, None)
            if comp_header:
                try:
                    comp_index = comp_header.index('HashedAadhaarNumber')
                except ValueError:
                    comp_index = 0  # Default to first column if not found
            else:
                comp_index = 0
                comp_file.seek(0)  # No header, reset to start
                comp_reader = csv.reader(comp_file)

            comparison_hashes = set()
            for row in comp_reader:
                if len(row) > comp_index:
                    comparison_hashes.add(row[comp_index].strip().lower())

            # Debugging: Print out the comparison hashes
            print("\nComparison Hashes:")
            for h in comparison_hashes:
                print(h)

        # Read Aadhaar numbers from the input file, clean them, and hash them
        input_hashes = set()
        with open(input_csv, 'r', newline='', encoding='utf-8') as input_file:
            input_reader = csv.reader(input_file)
            input_header = next(input_reader, None)
            if input_header:
                try:
                    aadhaar_index = input_header.index('AadhaarNumber')
                except ValueError:
                    aadhaar_index = 0  # Default to first column if not found
            else:
                aadhaar_index = 0
                input_file.seek(0)  # No header, reset to start
                input_reader = csv.reader(input_file)

            for row in input_reader:
                if len(row) > aadhaar_index:
                    aadhaar_num = row[aadhaar_index].strip()
                    cleaned_aadhaar = clean_aadhaar_number(aadhaar_num)
                    hashed_aadhaar = hashlib.sha256(cleaned_aadhaar.encode('utf-8')).hexdigest().lower()
                    input_hashes.add(hashed_aadhaar)

                    # Debugging: Print Aadhaar number, cleaned Aadhaar, and its hashed value
                    print(f"Aadhaar Number: {aadhaar_num} -> Cleaned: {cleaned_aadhaar} -> Hashed: {hashed_aadhaar}")

        # Debugging: Print out the input hashes
        print("\nInput Hashes:")
        for h in input_hashes:
            print(h)

        # Check if all hashed Aadhaar numbers from input are in comparison hashes
        all_present = input_hashes.issubset(comparison_hashes)

        # Debugging: Print the result of the comparison
        print("\nAll Input Hashes Present in Comparison File:", all_present)

        return all_present
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")
        return False

class AadhaarHashCheckerApp:
    def __init__(self, master):
        self.master = master
        master.title("Aadhaar Hash Checker")

        # Input CSV file for Aadhaar numbers
        self.input_csv_label = tk.Label(master, text="Input CSV (Aadhaar numbers):")
        self.input_csv_label.grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.input_csv_entry = tk.Entry(master, width=50)
        self.input_csv_entry.grid(row=0, column=1, padx=5, pady=5)
        self.input_csv_button = tk.Button(master, text="Browse", command=self.browse_input_csv)
        self.input_csv_button.grid(row=0, column=2, padx=5, pady=5)

        # Comparison CSV file with hashed Aadhaar numbers
        self.comparison_csv_label = tk.Label(master, text="Comparison CSV (Hashed Aadhaar numbers):")
        self.comparison_csv_label.grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.comparison_csv_entry = tk.Entry(master, width=50)
        self.comparison_csv_entry.grid(row=1, column=1, padx=5, pady=5)
        self.comparison_csv_button = tk.Button(master, text="Browse", command=self.browse_comparison_csv)
        self.comparison_csv_button.grid(row=1, column=2, padx=5, pady=5)

        # Button to perform the check
        self.check_button = tk.Button(master, text="Check Aadhaar Hashes", command=self.check_aadhaar_hashes)
        self.check_button.grid(row=2, column=1, pady=10)

    def browse_input_csv(self):
        filename = filedialog.askopenfilename(title="Select Input CSV File",
                                              filetypes=[("CSV files", "*.csv"), ("All files", "*.*")])
        if filename:
            self.input_csv_entry.delete(0, tk.END)
            self.input_csv_entry.insert(0, filename)

    def browse_comparison_csv(self):
        filename = filedialog.askopenfilename(title="Select Comparison CSV File",
                                              filetypes=[("CSV files", "*.csv"), ("All files", "*.*")])
        if filename:
            self.comparison_csv_entry.delete(0, tk.END)
            self.comparison_csv_entry.insert(0, filename)

    def check_aadhaar_hashes(self):
        input_csv = self.input_csv_entry.get()
        comparison_csv = self.comparison_csv_entry.get()
        if not input_csv or not comparison_csv:
            messagebox.showerror("Error", "Please select both input and comparison CSV files.")
            return
        if not os.path.isfile(input_csv):
            messagebox.showerror("Error", f"Input file '{input_csv}' does not exist.")
            return
        if not os.path.isfile(comparison_csv):
            messagebox.showerror("Error", f"Comparison file '{comparison_csv}' does not exist.")
            return
        try:
            result = check_all_hashes_present(input_csv, comparison_csv)
            if result:
                messagebox.showinfo("Result", "True: All hashed Aadhaar numbers are present in the comparison file.")
            else:
                messagebox.showinfo("Result", "False: Not all hashed Aadhaar numbers are present in the comparison file.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")

def main():
    root = tk.Tk()
    app = AadhaarHashCheckerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()